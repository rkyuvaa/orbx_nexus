const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

router.post('/', async (req, res) => {
    const { branch_id, records } = req.body;
    
    if (!records || !Array.isArray(records)) {
        return res.status(400).json({ error: 'Invalid sync data' });
    }

    const results = {
        success: [],
        failed: []
    };

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const record of records) {
            try {
                if (record.type === 'SALE') {
                    // Check if already synced (idempotency)
                    const existing = await client.query('SELECT id FROM sales WHERE offline_id = $1', [record.data.offline_id]);
                    if (existing.rows.length === 0) {
                        const sale = await client.query(
                            `INSERT INTO sales (branch_id, user_id, customer_name, customer_mobile, total_amount, tax_amount, discount_amount, payment_method, offline_id, created_at)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
                            [branch_id, record.data.user_id, record.data.customer_name, record.data.customer_mobile, record.data.total_amount, record.data.tax_amount, record.data.discount_amount, record.data.payment_method, record.data.offline_id, record.timestamp]
                        );

                        const saleId = sale.rows[0].id;

                        for (const item of record.data.items) {
                            await client.query(
                                `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, tax_amount)
                                 VALUES ($1, $2, $3, $4, $5)`,
                                [saleId, item.product_id, item.quantity, item.unit_price, item.tax_amount]
                            );

                            // Update stock level
                            await client.query(
                                `UPDATE inventory SET quantity = quantity - $1, last_updated = CURRENT_TIMESTAMP
                                 WHERE branch_id = $2 AND product_id = $3`,
                                [item.quantity, branch_id, item.product_id]
                            );
                        }
                    }
                } else if (record.type === 'PRODUCT_ADD') {
                    // Check if SKU already exists
                    const existing = await client.query('SELECT id FROM products WHERE sku = $1', [record.data.sku]);
                    if (existing.rows.length === 0) {
                        await client.query(
                            'INSERT INTO products (sku, barcode, name, category, price, tax_percent, min_stock_level) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                            [record.data.sku, record.data.barcode, record.data.name, record.data.category, record.data.price, record.data.tax_percent, record.data.min_stock_level]
                        );
                    }
                }
                results.success.push(record.id);
            } catch (err) {
                console.error('Sync error for record:', record.id, err);
                results.failed.push({ id: record.id, error: err.message });
            }
        }

        await client.query('COMMIT');
        res.json({ status: 'ok', results });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Sync transaction failed', details: err.message });
    } finally {
        client.release();
    }
});

// Get updates for client (incremental sync)
router.get('/updates', async (req, res) => {
    const { branch_id, lastSync } = req.query;
    try {
        const syncDate = lastSync || '1970-01-01T00:00:00Z';
        
        // Log query for debugging
        console.log(`Syncing for branch ${branch_id} since ${syncDate}`);

        const products = await pool.query('SELECT * FROM products WHERE created_at > $1', [syncDate]);
        const inventory = await pool.query('SELECT * FROM inventory WHERE branch_id = $1 AND last_updated > $2', [branch_id || 1, syncDate]);
        
        res.json({
            timestamp: new Date().toISOString(),
            products: products.rows,
            inventory: inventory.rows
        });
    } catch (err) {
        console.error('Error in /updates route:', err.message);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

module.exports = router;
