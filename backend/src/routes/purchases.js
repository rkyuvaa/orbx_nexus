const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateToken, hasPermission } = require('../utils/auth');
const { getNextSequence } = require('../utils/sequence');

// GET /api/purchases
router.get('/', authenticateToken, hasPermission('purchases', 'view'), async (req, res) => {
    try {
        const { branch_id } = req.query;
        let query = `
            SELECT p.*, s.name as supplier_name, b.name as branch_name, u.name as created_by_name
            FROM purchases p
            JOIN suppliers s ON p.supplier_id = s.id
            JOIN branches b ON p.branch_id = b.id
            JOIN users u ON p.created_by = u.id
        `;
        const params = [];
        if (branch_id) {
            query += ` WHERE p.branch_id = $1`;
            params.push(branch_id);
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
        
        const po_number = await getNextSequence('purchases');
        
        const pRes = await client.query(
            `INSERT INTO purchases (po_number, supplier_id, branch_id, subtotal, tax_total, total_amount, notes, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
            [po_number, supplier_id, branch_id, subtotal, tax_total, total_amount, notes, req.user.id]
        );
        const purchase_id = pRes.rows[0].id;
        
        for (const item of items) {
            await client.query(
                `INSERT INTO purchase_items (purchase_id, product_id, qty, cost_price, tax_percent, total)
                 VALUES ($1,$2,$3,$4,$5,$6)`,
                [purchase_id, item.product_id, item.qty, item.cost_price, item.tax_percent, item.total]
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

// PUT /api/purchases/:id/receive (Receive Goods)
router.put('/:id/receive', authenticateToken, hasPermission('purchases', 'receive'), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const pRes = await client.query('SELECT * FROM purchases WHERE id = $1 FOR UPDATE', [req.params.id]);
        if (pRes.rows.length === 0) throw new Error('Purchase order not found');
        if (pRes.rows[0].status === 'received') throw new Error('Already received');
        
        const purchase = pRes.rows[0];
        const itemsRes = await client.query('SELECT * FROM purchase_items WHERE purchase_id = $1', [req.params.id]);
        
        for (const item of itemsRes.rows) {
            await client.query(`
                INSERT INTO inventory (product_id, branch_id, quantity)
                VALUES ($1, $2, $3)
                ON CONFLICT (product_id, branch_id)
                DO UPDATE SET quantity = inventory.quantity + $3, last_updated = CURRENT_TIMESTAMP
            `, [item.product_id, purchase.branch_id, item.qty]);
        }
        
        await client.query(
            'UPDATE purchases SET status = $1, received_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['received', req.params.id]
        );
        
        await client.query('COMMIT');
        res.json({ message: 'Goods received and inventory updated' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;
