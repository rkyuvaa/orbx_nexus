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

// GET /api/departments
router.get('/', requireAdmin, async (req, res) => {
    try {
        const tableCheck = await pool.query("SELECT 1 FROM information_schema.tables WHERE table_name = 'departments'");
        if (tableCheck.rows.length === 0) return res.json([]);
        
        const result = await pool.query('SELECT * FROM departments ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching departments:', err);
        res.json([]); // Return empty list instead of crashing
    }
});

// POST /api/departments
router.post('/', requireAdmin, async (req, res) => {
    const { name } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO departments (name) VALUES ($1) RETURNING *',
            [name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/departments/:id
router.put('/:id', requireAdmin, async (req, res) => {
    const { name } = req.body;
    try {
        const result = await pool.query(
            'UPDATE departments SET name=$1 WHERE id=$2 RETURNING *',
            [name, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/departments/:id
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM departments WHERE id=$1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
