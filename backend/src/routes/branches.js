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

// GET /api/branches
router.get('/', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM branches ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/branches
router.post('/', requireAdmin, async (req, res) => {
    const { name, location, is_warehouse } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO branches (name, location, is_warehouse) VALUES ($1,$2,$3) RETURNING *',
            [name, location || null, is_warehouse || false]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/branches/:id
router.put('/:id', requireAdmin, async (req, res) => {
    const { name, location, is_warehouse } = req.body;
    try {
        const result = await pool.query(
            'UPDATE branches SET name=$1, location=$2, is_warehouse=$3 WHERE id=$4 RETURNING *',
            [name, location || null, is_warehouse || false, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/branches/:id
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM branches WHERE id=$1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
