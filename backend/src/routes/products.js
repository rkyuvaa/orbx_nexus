const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateToken, hasPermission } = require('../utils/auth');

// GET all products (Available for all authenticated users/branches)
router.get('/', authenticateToken, hasPermission('products', 'view'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new product (Warehouse Admin/Staff with permission)
router.post('/', authenticateToken, hasPermission('products', 'create'), async (req, res) => {
  const { sku, barcode, name, category_id, price, tax_percent, min_stock_level } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (sku, barcode, name, category_id, price, tax_percent, min_stock_level) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [sku, barcode, name, category_id, price, tax_percent, min_stock_level]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update product (Warehouse Admin/Staff with permission)
router.put('/:id', authenticateToken, hasPermission('products', 'edit'), async (req, res) => {
  const { id } = req.params;
  const { sku, barcode, name, category_id, price, tax_percent, min_stock_level } = req.body;
  try {
    const result = await pool.query(
      'UPDATE products SET sku=$1, barcode=$2, name=$3, category_id=$4, price=$5, tax_percent=$6, min_stock_level=$7 WHERE id=$8 RETURNING *',
      [sku, barcode, name, category_id, price, tax_percent, min_stock_level, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET lookup by barcode (for POS)
router.get('/lookup/:barcode', authenticateToken, async (req, res) => {
  const { barcode } = req.params;
  try {
    // 1. Check products table (manufacturer barcode or SKU)
    const pRes = await pool.query(
      'SELECT * FROM products WHERE barcode = $1 OR sku = $1',
      [barcode]
    );
    if (pRes.rows.length > 0) return res.json(pRes.rows[0]);

    // 2. Check barcodes_ledger
    const lRes = await pool.query(
      `SELECT p.* 
       FROM barcodes_ledger bl
       JOIN products p ON bl.product_id = p.id
       WHERE bl.barcode = $1 AND bl.status = 'available'`,
      [barcode]
    );
    if (lRes.rows.length > 0) return res.json(lRes.rows[0]);

    res.status(404).json({ error: 'Product not found for this barcode' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
