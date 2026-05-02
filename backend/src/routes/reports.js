const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// GET /api/reports/dashboard
router.get('/dashboard', async (req, res) => {
    try {
        // 1. Today's Sales
        const salesResult = await pool.query(`
            SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count 
            FROM sales 
            WHERE created_at::date = CURRENT_DATE
        `);
        
        // 2. Low Stock Items (less than 5 units)
        const stockResult = await pool.query(`
            SELECT COUNT(*) as count FROM inventory WHERE quantity < 5
        `);

        // 3. Recent Transactions
        const recentSales = await pool.query(`
            SELECT s.*, u.name as user_name 
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
            LIMIT 5
        `);

        // 4. Inventory Highlights
        const highlights = await pool.query(`
            SELECT p.name, i.quantity, p.min_stock_level
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            ORDER BY i.quantity ASC
            LIMIT 5
        `);

        res.json({
            stats: {
                todaySales: parseFloat(salesResult.rows[0].total),
                transactions: parseInt(salesResult.rows[0].count),
                lowStock: parseInt(stockResult.rows[0].count),
                activeTransfers: 0 // Placeholder
            },
            recentSales: recentSales.rows,
            inventoryHighlights: highlights.rows
        });
    } catch (err) {
        console.error('Dashboard data error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
