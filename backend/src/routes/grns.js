const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateToken, hasPermission } = require('../utils/auth');
const { getNextSequence } = require('../utils/sequence');

// GET /api/grns
router.get('/', authenticateToken, hasPermission('purchases', 'view'), async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT g.*, p.po_number, s.name as supplier_name, u.name as created_by_name, a.name as approved_by_name
            FROM grns g
            JOIN purchases p ON g.purchase_id = p.id
            JOIN suppliers s ON p.supplier_id = s.id
            JOIN users u ON g.created_by = u.id
            LEFT JOIN users a ON g.approved_by = a.id
        `;
        const params = [];
        if (status) {
            query += ' WHERE g.status = $1';
            params.push(status);
        }
        query += ' ORDER BY g.created_at DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/grns/:id (Details)
router.get('/:id', authenticateToken, hasPermission('purchases', 'view'), async (req, res) => {
    try {
        const gRes = await pool.query(
            `SELECT g.*, p.po_number, s.name as supplier_name, b.name as branch_name
             FROM grns g
             JOIN purchases p ON g.purchase_id = p.id
             JOIN suppliers s ON p.supplier_id = s.id
             JOIN branches b ON p.branch_id = b.id
             WHERE g.id = $1`, [req.params.id]
        );
        if (gRes.rows.length === 0) return res.status(404).json({ error: 'GRN not found' });
        
        const itemsRes = await pool.query(
            `SELECT gi.*, pr.name as product_name, pr.sku
             FROM grn_items gi
             JOIN products pr ON gi.product_id = pr.id
             WHERE gi.grn_id = $1`, [req.params.id]
        );
        
        res.json({ ...gRes.rows[0], items: itemsRes.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/grns (Create GRN from PO)
router.post('/', authenticateToken, hasPermission('purchases', 'receive'), async (req, res) => {
    const { purchase_id, items, barcode_config } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const grn_number = await getNextSequence('grns');
        
        const gRes = await client.query(
            `INSERT INTO grns (purchase_id, grn_number, barcode_config, created_by, status)
             VALUES ($1, $2, $3, $4, 'pending') RETURNING id`,
            [purchase_id, grn_number, JSON.stringify(barcode_config || {}), req.user.id]
        );
        const grn_id = gRes.rows[0].id;
        
        for (const item of items) {
            // Barcode Generation logic if configured
            let barcodes = [];
            if (barcode_config?.enabled) {
                const prefix = barcode_config.prefix || 'BC';
                for (let i = 0; i < item.quantity; i++) {
                    const uniqueId = Math.random().toString(36).substr(2, 6).toUpperCase();
                    barcodes.push(`${prefix}-${uniqueId}`);
                }
            }

            await client.query(
                `INSERT INTO grn_items (grn_id, product_id, quantity, attributes, barcodes)
                 VALUES ($1, $2, $3, $4, $5)`,
                [grn_id, item.product_id, item.quantity, JSON.stringify(item.attributes || {}), JSON.stringify(barcodes)]
            );
        }
        
        await client.query('COMMIT');
        res.status(201).json({ id: grn_id, grn_number });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// POST /api/grns/:id/approve (Manager Approval)
router.post('/:id/approve', authenticateToken, async (req, res) => {
    // Only Managers or Superadmins can approve
    if (!req.user.is_superadmin && req.user.role_type !== 'Warehouse') {
        return res.status(403).json({ error: 'Only Warehouse Managers can approve GRNs' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const gRes = await client.query('SELECT * FROM grns WHERE id = $1 FOR UPDATE', [req.params.id]);
        if (gRes.rows.length === 0) throw new Error('GRN not found');
        if (gRes.rows[0].status !== 'pending') throw new Error('GRN is not pending approval');
        
        const grn = gRes.rows[0];
        const pRes = await client.query('SELECT branch_id FROM purchases WHERE id = $1', [grn.purchase_id]);
        const branch_id = pRes.rows[0].branch_id;

        const itemsRes = await client.query('SELECT * FROM grn_items WHERE grn_id = $1', [grn.id]);
        
        for (const item of itemsRes.rows) {
            // 1. Update Inventory
            await client.query(`
                INSERT INTO inventory (product_id, branch_id, quantity)
                VALUES ($1, $2, $3)
                ON CONFLICT (product_id, branch_id)
                DO UPDATE SET quantity = inventory.quantity + $3, last_updated = CURRENT_TIMESTAMP
            `, [item.product_id, branch_id, item.quantity]);

            // 2. Create Movement Log
            await client.query(`
                INSERT INTO inventory_logs (product_id, branch_id, action_type, qty_change, reference_type, reference_id, created_by, approved_by)
                VALUES ($1, $2, 'GRN_RECEIPT', $3, 'GRN', $4, $5, $6)
            `, [item.product_id, branch_id, item.quantity, grn.id, grn.created_by, req.user.id]);

            // 3. Populate Barcodes Ledger
            const barcodes = Array.isArray(item.barcodes) ? item.barcodes : [];
            for (const bc of barcodes) {
                await client.query(`
                    INSERT INTO barcodes_ledger (barcode, product_id, grn_id, branch_id, status)
                    VALUES ($1, $2, $3, $4, 'available')
                    ON CONFLICT (barcode) DO UPDATE SET 
                        branch_id = EXCLUDED.branch_id,
                        status = 'available'
                `, [bc, item.product_id, grn.id, branch_id]);
            }

            // 4. Update received_qty in purchase_items
            await client.query(`
                UPDATE purchase_items 
                SET received_qty = received_qty + $1 
                WHERE purchase_id = $2 AND product_id = $3
            `, [item.quantity, grn.purchase_id, item.product_id]);
        }
        
        // Update GRN status
        await client.query(
            'UPDATE grns SET status = $1, approved_by = $2, received_at = CURRENT_TIMESTAMP WHERE id = $3',
            ['approved', req.user.id, grn.id]
        );

        // Check if PO is completed
        const poItems = await client.query('SELECT SUM(qty) as total, SUM(received_qty) as received FROM purchase_items WHERE purchase_id = $1', [grn.purchase_id]);
        if (parseInt(poItems.rows[0].received) >= parseInt(poItems.rows[0].total)) {
            await client.query("UPDATE purchases SET status = 'received' WHERE id = $1", [grn.purchase_id]);
        } else {
            await client.query("UPDATE purchases SET status = 'partial' WHERE id = $1", [grn.purchase_id]);
        }
        
        await client.query('COMMIT');
        res.json({ message: 'GRN Approved and Stock Updated' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// POST /api/grns/:id/reject
router.post('/:id/reject', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "UPDATE grns SET status = 'rejected', approved_by = $1 WHERE id = $2 AND status = 'pending' RETURNING *",
            [req.user.id, req.params.id]
        );
        if (result.rows.length === 0) return res.status(400).json({ error: 'Cannot reject. Not pending.' });
        res.json({ message: 'GRN Rejected' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
