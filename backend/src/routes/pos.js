const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateToken } = require('../utils/auth');

// Create a new sale
router.post('/sale', authenticateToken, async (req, res) => {
  const { 
    offline_id, customer_id, items, subtotal, 
    tax_total, discount_amt, total_amount, payment_mode 
  } = req.body;
  const user_id = req.user.id;
  const branch_id = req.user.branch_id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert Sale record
    const saleResult = await client.query(
      `INSERT INTO sales (
        offline_id, branch_id, user_id, customer_id, 
        subtotal, tax_total, discount_amt, total_amount, payment_mode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [offline_id, branch_id, user_id, customer_id, subtotal, tax_total, discount_amt, total_amount, payment_mode]
    );
    const saleId = saleResult.rows[0].id;

    // 2. Insert Sale Items and update inventory
    for (const item of items) {
      await client.query(
        'INSERT INTO sale_items (sale_id, product_id, qty, price, tax, barcode) VALUES ($1, $2, $3, $4, $5, $6)',
        [saleId, item.product_id, item.qty, item.price, item.tax, item.barcode || null]
      );

      // If specific barcode sold, update ledger
      if (item.barcode) {
        await client.query(
          "UPDATE barcodes_ledger SET status = 'sold', sale_id = $1 WHERE barcode = $2",
          [saleId, item.barcode]
        );
      }

      // Deduct from branch inventory
      await client.query(
        'UPDATE inventory SET quantity = quantity - $1 WHERE branch_id = $2 AND product_id = $3',
        [item.qty, branch_id, item.product_id]
      );

      // Log movement
      await client.query(`
        INSERT INTO inventory_logs (product_id, branch_id, action_type, qty_change, reference_type, reference_id, created_by)
        VALUES ($1, $2, 'SALE', $3, 'SALE', $4, $5)
      `, [item.product_id, branch_id, -item.qty, saleId, user_id]);
    }

    await client.query('COMMIT');
    res.status(201).json({ id: saleId, message: 'Sale logged and inventory updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to process sale' });
  } finally {
    client.release();
  }
});

// Get sales list for current branch
router.get('/history', authenticateToken, async (req, res) => {
  const branch_id = req.user.branch_id;
  try {
    const result = await pool.query(
      `SELECT s.*, c.name as customer_name, u.name as billed_by 
       FROM sales s 
       LEFT JOIN customers c ON s.customer_id = c.id 
       LEFT JOIN users u ON s.user_id = u.id 
       WHERE s.branch_id = $1 
       ORDER BY s.created_at DESC LIMIT 50`,
      [branch_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
