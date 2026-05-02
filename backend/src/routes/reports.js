const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateToken, hasPermission } = require('../utils/auth');

// GET /api/reports/dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        
        // Fetch user permissions for reports
        const pRes = await pool.query(`
            SELECT r.role_type, r.permissions 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = $1
        `, [user.id]);
        
        const { role_type, permissions } = pRes.rows[0];
        const canViewAll = permissions.reports?.includes('view_all') && role_type === 'Warehouse';
        const branchId = user.branch_id;

        const branchFilter = canViewAll ? '' : `AND branch_id = ${branchId}`;
        const branchFilterWhere = canViewAll ? '' : `WHERE branch_id = ${branchId}`;

        // 1. Today's Sales
        const salesResult = await pool.query(`
            SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count 
            FROM sales 
            WHERE created_at::date = CURRENT_DATE ${branchFilter}
        `);
        
        // 2. Low Stock Items
        const stockResult = await pool.query(`
            SELECT COUNT(*) as count FROM inventory 
            WHERE quantity < 5 ${branchFilter}
        `);

        // 3. Recent Transactions
        const recentSales = await pool.query(`
            SELECT s.*, u.name as user_name, b.name as branch_name
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN branches b ON s.branch_id = b.id
            ${branchFilterWhere}
            ORDER BY s.created_at DESC
            LIMIT 5
        `);

        // 4. Inventory Highlights
        const highlights = await pool.query(`
            SELECT p.name, i.quantity, p.min_stock_level, b.name as branch_name
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            JOIN branches b ON i.branch_id = b.id
            ${branchFilterWhere}
            ORDER BY i.quantity ASC
            LIMIT 5
        `);

        res.json({
            stats: {
                todaySales: parseFloat(salesResult.rows[0].total),
                transactions: parseInt(salesResult.rows[0].count),
                lowStock: parseInt(stockResult.rows[0].count),
                activeTransfers: 0 
            },
            recentSales: recentSales.rows,
            inventoryHighlights: highlights.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
