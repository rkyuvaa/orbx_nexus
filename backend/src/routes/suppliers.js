const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateToken } = require('../utils/auth');

// GET /api/suppliers
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM suppliers ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/suppliers
router.post('/', authenticateToken, async (req, res) => {
    const { name, contact_person, email, phone, address, gstin } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO suppliers (name, contact_person, email, phone, address, gstin) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [name, contact_person, email, phone, address, gstin]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/suppliers/:id
router.put('/:id', authenticateToken, async (req, res) => {
    const { name, contact_person, email, phone, address, gstin, is_active } = req.body;
    try {
        const result = await pool.query(
            'UPDATE suppliers SET name=$1, contact_person=$2, email=$3, phone=$4, address=$5, gstin=$6, is_active=$7 WHERE id=$8 RETURNING *',
            [name, contact_person, email, phone, address, gstin, is_active, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
