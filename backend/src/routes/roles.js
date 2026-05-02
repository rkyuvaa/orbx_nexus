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

// GET /api/roles
router.get('/', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM roles ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/roles
router.post('/', requireAdmin, async (req, res) => {
    const { name, permissions } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO roles (name, permissions) VALUES ($1,$2) RETURNING *',
            [name, JSON.stringify(permissions || {})]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/roles/:id
router.put('/:id', requireAdmin, async (req, res) => {
    const { name, permissions } = req.body;
    try {
        const result = await pool.query(
            'UPDATE roles SET name=$1, permissions=$2 WHERE id=$3 RETURNING *',
            [name, JSON.stringify(permissions || {}), req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/roles/:id
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM roles WHERE id=$1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
