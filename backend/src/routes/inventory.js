const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateToken, hasPermission } = require('../utils/auth');

// GET inventory
router.get('/', authenticateToken, hasPermission('inventory', 'view'), async (req, res) => {
    try {
        const { branch_id } = req.query;
        let query = `
            SELECT i.*, p.name as product_name, p.sku, p.category, p.min_stock_level, b.name as branch_name
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            JOIN branches b ON i.branch_id = b.id
        `;
        const params = [];
        if (branch_id) {
            query += ` WHERE i.branch_id = $1`;
            params.push(branch_id);
        }
        query += ` ORDER BY p.name ASC`;
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST adjustment
router.post('/adjust', authenticateToken, hasPermission('inventory', 'adjust'), async (req, res) => {
    const { product_id, branch_id, adjustment_qty, reason } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const result = await client.query(`
            INSERT INTO inventory (product_id, branch_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (product_id, branch_id)
            DO UPDATE SET 
                quantity = inventory.quantity + $3,
                last_updated = CURRENT_TIMESTAMP
            RETURNING *
        `, [product_id, branch_id, adjustment_qty]);

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;
