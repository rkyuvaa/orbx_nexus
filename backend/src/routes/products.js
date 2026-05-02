const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// GET all products
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new product
router.post('/', async (req, res) => {
  const { sku, barcode, name, category, price, tax_percent, min_stock_level } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (sku, barcode, name, category, price, tax_percent, min_stock_level) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [sku, barcode, name, category, price, tax_percent, min_stock_level]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update product
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { sku, barcode, name, category, price, tax_percent, min_stock_level } = req.body;
  try {
    const result = await pool.query(
      'UPDATE products SET sku=$1, barcode=$2, name=$3, category=$4, price=$5, tax_percent=$6, min_stock_level=$7 WHERE id=$8 RETURNING *',
      [sku, barcode, name, category, price, tax_percent, min_stock_level, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
