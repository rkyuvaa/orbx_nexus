const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateToken } = require('../utils/auth');

// Get all transfers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, 
             fb.name as from_branch_name, 
             tb.name as to_branch_name,
             u.name as created_by_name
      FROM transfers t
      LEFT JOIN branches fb ON t.from_branch_id = fb.id
      LEFT JOIN branches tb ON t.to_branch_id = tb.id
      LEFT JOIN users u ON t.created_by = u.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create transfer request
router.post('/', authenticateToken, async (req, res) => {
  const { from_branch_id, to_branch_id, items, notes } = req.body;
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      'INSERT INTO transfers (from_branch_id, to_branch_id, items, notes, created_by, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [from_branch_id, to_branch_id, items, notes, user_id, 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update transfer status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!['pending', 'approved', 'shipped', 'received'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await pool.query(
      'UPDATE transfers SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transfer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
