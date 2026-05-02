const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateToken, requireAdmin } = require('../utils/auth');

// GET /api/roles
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM roles ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/roles
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    const { name, role_type, permissions } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO roles (name, role_type, permissions) VALUES ($1,$2,$3) RETURNING *',
            [name, role_type || 'Branch', JSON.stringify(permissions || {})]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/roles/:id
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { name, role_type, permissions } = req.body;
    try {
        const result = await pool.query(
            'UPDATE roles SET name=$1, role_type=$2, permissions=$3 WHERE id=$4 RETURNING *',
            [name, role_type, JSON.stringify(permissions || {}), req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/roles/:id
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM roles WHERE id=$1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
