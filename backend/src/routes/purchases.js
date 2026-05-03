const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateToken, hasPermission } = require('../utils/auth');
const { getNextSequence } = require('../utils/sequence');

// GET /api/purchases
router.get('/', authenticateToken, hasPermission('purchases', 'view'), async (req, res) => {
    try {
        const { branch_id, status } = req.query;
        let query = `
            SELECT p.*, s.name as supplier_name, b.name as branch_name, u.name as created_by_name
            FROM purchases p
            JOIN suppliers s ON p.supplier_id = s.id
            JOIN branches b ON p.branch_id = b.id
            JOIN users u ON p.created_by = u.id
        `;
        const params = [];
        const conditions = [];

        if (branch_id) {
            params.push(branch_id);
            conditions.push(`p.branch_id = $${params.length}`);
        }
        if (status) {
            params.push(status);
            conditions.push(`p.status = $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ` ORDER BY p.created_at DESC`;
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/purchases/:id (Details)
router.get('/:id', authenticateToken, hasPermission('purchases', 'view'), async (req, res) => {
    try {
        const pRes = await pool.query(
            `SELECT p.*, s.name as supplier_name, b.name as branch_name, u.name as created_by_name
             FROM purchases p
             JOIN suppliers s ON p.supplier_id = s.id
             JOIN branches b ON p.branch_id = b.id
             JOIN users u ON p.created_by = u.id
             WHERE p.id = $1`, [req.params.id]
        );
        if (pRes.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        
        const itemsRes = await pool.query(
            `SELECT pi.*, pr.name as product_name, pr.sku
             FROM purchase_items pi
             JOIN products pr ON pi.product_id = pr.id
             WHERE pi.purchase_id = $1`, [req.params.id]
        );
        
        res.json({ ...pRes.rows[0], items: itemsRes.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/purchases (Create PO)
router.post('/', authenticateToken, hasPermission('purchases', 'create'), async (req, res) => {
    const { supplier_id, branch_id, items, notes, subtotal, tax_total, total_amount } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // PO Number generation
        const po_number = await getNextSequence('purchases');
        
        const pRes = await client.query(
            `INSERT INTO purchases (po_number, supplier_id, branch_id, subtotal, tax_total, total_amount, notes, created_by, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8, 'pending') RETURNING id`,
            [po_number, supplier_id, branch_id, subtotal, tax_total, total_amount, notes, req.user.id]
        );
        const purchase_id = pRes.rows[0].id;
        
        for (const item of items) {
            await client.query(
                `INSERT INTO purchase_items (purchase_id, product_id, qty, cost_price, tax_percent, total, attributes)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                [purchase_id, item.product_id, item.qty, item.cost_price, item.tax_percent, item.total, JSON.stringify(item.attributes || {})]
            );
        }
        
        await client.query('COMMIT');
        res.status(201).json({ id: purchase_id, po_number });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// CANCEL PO
router.put('/:id/cancel', authenticateToken, hasPermission('purchases', 'edit'), async (req, res) => {
    try {
        const result = await pool.query(
            "UPDATE purchases SET status = 'cancelled' WHERE id = $1 AND status = 'pending' RETURNING *",
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(400).json({ error: 'Cannot cancel. Already received or not found.' });
        res.json({ message: 'PO Cancelled' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
