const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { verifyToken } = require('../utils/auth');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function requireAdmin(req, res, next) {
    const token = (req.headers.authorization || '').split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    req.user = decoded;
    next();
}

// Ensure table exists on first call
async function ensureTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS salespersons (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE,
            phone VARCHAR(20),
            branch_id INTEGER REFERENCES branches(id),
            commission_percent DECIMAL(5,2) DEFAULT 0,
            target_amount DECIMAL(12,2) DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// GET /api/salespersons
router.get('/', requireAdmin, async (req, res) => {
    try {
        await ensureTable();
        const result = await pool.query(`
            SELECT s.*, b.name as branch_name
            FROM salespersons s
            LEFT JOIN branches b ON s.branch_id = b.id
            ORDER BY s.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching salespersons:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/salespersons
router.post('/', requireAdmin, async (req, res) => {
    const { name, email, phone, branch_id, commission_percent, target_amount } = req.body;
    try {
        await ensureTable();
        const result = await pool.query(
            `INSERT INTO salespersons (name, email, phone, branch_id, commission_percent, target_amount)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [name, email || null, phone || null, branch_id || null,
             commission_percent || 0, target_amount || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/salespersons/:id
router.put('/:id', requireAdmin, async (req, res) => {
    const { name, email, phone, branch_id, commission_percent, target_amount, is_active } = req.body;
    try {
        const result = await pool.query(
            `UPDATE salespersons 
             SET name=$1, email=$2, phone=$3, branch_id=$4, commission_percent=$5, target_amount=$6, is_active=$7
             WHERE id=$8 RETURNING *`,
            [name, email || null, phone || null, branch_id || null,
             commission_percent || 0, target_amount || 0, is_active !== false, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/salespersons/:id
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM salespersons WHERE id=$1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
