const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateToken } = require('../utils/auth');

// Get all customers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create customer
router.post('/', authenticateToken, async (req, res) => {
  const { name, phone, email, address } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });

  try {
    const result = await pool.query(
      'INSERT INTO customers (name, phone, email, address) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, phone, email, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update customer
router.put('/:id', authenticateToken, async (req, res) => {
  const { name, phone, email, address } = req.body;
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE customers SET name = $1, phone = $2, email = $3, address = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, phone, email, address, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get customer sales history
router.get('/:id/sales', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT s.*, u.name as billed_by FROM sales s LEFT JOIN users u ON s.user_id = u.id WHERE s.customer_id = $1 ORDER BY s.created_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
