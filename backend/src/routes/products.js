const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateToken, hasPermission } = require('../utils/auth');

// GET all products (Available for all authenticated users/branches)
router.get('/', authenticateToken, hasPermission('products', 'view'), async (req, res) => {
  try {
    const result = await pool.query(`
        SELECT p.*, c.name as category_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new product (Warehouse Admin/Staff with permission)
router.post('/', authenticateToken, hasPermission('products', 'create'), async (req, res) => {
  const { sku, barcode, name, category_id, price, tax_percent, min_stock_level, stock } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Insert product
    const result = await client.query(
      'INSERT INTO products (sku, barcode, name, category_id, price, tax_percent, min_stock_level) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [sku, barcode, name, category_id || null, price, tax_percent, min_stock_level]
    );
    const product = result.rows[0];

    // 2. Initialize stock if provided (usually for first warehouse)
    if (stock > 0) {
        const hqRes = await client.query('SELECT id FROM branches WHERE is_warehouse = true LIMIT 1');
        if (hqRes.rows.length > 0) {
            await client.query(
                'INSERT INTO inventory (branch_id, product_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (branch_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity',
                [hqRes.rows[0].id, product.id, stock]
            );
        }
    }

    await client.query('COMMIT');
    res.status(201).json(product);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT update product (Warehouse Admin/Staff with permission)
router.put('/:id', authenticateToken, hasPermission('products', 'edit'), async (req, res) => {
  const { id } = req.params;
  const { sku, barcode, name, category_id, price, tax_percent, min_stock_level } = req.body;
  try {
    const result = await pool.query(
      'UPDATE products SET sku=$1, barcode=$2, name=$3, category_id=$4, price=$5, tax_percent=$6, min_stock_level=$7 WHERE id=$8 RETURNING *',
      [sku, barcode, name, category_id || null, price, tax_percent, min_stock_level, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
router.delete('/:id', authenticateToken, hasPermission('products', 'edit'), async (req, res) => {
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
