const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { verifyToken } = require('../utils/auth');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Middleware to verify admin/manager access
async function requireAuth(req, res, next) {
    const token = (req.headers.authorization || '').split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    req.user = decoded;
    next();
}

// GET inventory for a specific branch or all
router.get('/', requireAuth, async (req, res) => {
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

// POST adjustment (Manually update stock)
router.post('/adjust', requireAuth, async (req, res) => {
    const { product_id, branch_id, adjustment_qty, reason } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Update or Insert inventory
        const result = await client.query(`
            INSERT INTO inventory (product_id, branch_id, quantity, last_updated)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (product_id, branch_id)
            DO UPDATE SET 
                quantity = inventory.quantity + $3,
                last_updated = CURRENT_TIMESTAMP
            RETURNING *
        `, [product_id, branch_id, adjustment_qty]);

        // Log the adjustment (Optional: we can create an inventory_logs table later)
        
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
