const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateToken, hasPermission } = require('../utils/auth');

// GET inventory
router.get('/', authenticateToken, hasPermission('inventory', 'view'), async (req, res) => {
    try {
        const { branch_id } = req.query;
        let query = `
            SELECT i.*, p.name as product_name, p.sku, p.category, p.min_stock_level, b.name as branch_name
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            JOIN branches b ON i.branch_id = b.id
        `;
        const params = [];
        if (branch_id) {
            query += ` WHERE i.branch_id = $1`;
            params.push(branch_id);
        }
        query += ` ORDER BY p.name ASC`;
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST adjustment
router.post('/adjust', authenticateToken, hasPermission('inventory', 'adjust'), async (req, res) => {
    const { product_id, branch_id, adjustment_qty, reason } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const result = await client.query(`
            INSERT INTO inventory (product_id, branch_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (product_id, branch_id)
            DO UPDATE SET 
                quantity = inventory.quantity + $3,
                last_updated = CURRENT_TIMESTAMP
            RETURNING *
        `, [product_id, branch_id, adjustment_qty]);

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// GET inventory logs
router.get('/logs', authenticateToken, hasPermission('inventory', 'view'), async (req, res) => {
    try {
        const { product_id, branch_id } = req.query;
        let query = `
            WITH RECURSIVE category_path AS (
                SELECT id, name, parent_id, name::text as path, 1 as depth
                FROM categories
                WHERE parent_id IS NULL
                UNION ALL
                SELECT c.id, c.name, c.parent_id, cp.path || ' > ' || c.name, cp.depth + 1
                FROM categories c
                JOIN category_path cp ON c.parent_id = cp.id
            )
            SELECT 
                l.*, 
                p.name as product_name, p.sku,
                cp.path as category_hierarchy,
                u.name as created_by_name,
                a.name as approved_by_name,
                b.name as branch_name,
                g.grn_number as ref_number
            FROM inventory_logs l
            JOIN products p ON l.product_id = p.id
            LEFT JOIN category_path cp ON p.category_id = cp.id
            JOIN users u ON l.created_by = u.id
            LEFT JOIN users a ON l.approved_by = a.id
            JOIN branches b ON l.branch_id = b.id
            LEFT JOIN grns g ON l.reference_id = g.id AND l.reference_type = 'GRN'
        `;
        const params = [];
        const conditions = [];

        if (product_id) {
            params.push(product_id);
            conditions.push(`l.product_id = $${params.length}`);
        }
        if (branch_id) {
            params.push(branch_id);
            conditions.push(`l.branch_id = $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY l.timestamp DESC LIMIT 500';
        
// GET product traceability
router.get('/trace/:id', authenticateToken, hasPermission('inventory', 'view'), async (req, res) => {
    try {
        const product_id = req.params.id;
        
        // 1. Product Summary & Hierarchy
        const productRes = await pool.query(`
            WITH RECURSIVE category_path AS (
                SELECT id, name, parent_id, name::text as path, 1 as depth
                FROM categories
                WHERE parent_id IS NULL
                UNION ALL
                SELECT c.id, c.name, c.parent_id, cp.path || ' > ' || c.name, cp.depth + 1
                FROM categories c
                JOIN category_path cp ON c.parent_id = cp.id
            )
            SELECT p.*, cp.path as category_hierarchy, c.name as category_name
            FROM products p
            LEFT JOIN category_path cp ON p.category_id = cp.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = $1
        `, [product_id]);
        
        if (productRes.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        const product = productRes.rows[0];

        // 2. Barcode Ledger Breakdown
        const ledgerRes = await pool.query(`
            SELECT bl.*, b.name as branch_name, g.grn_number
            FROM barcodes_ledger bl
            JOIN branches b ON bl.branch_id = b.id
            JOIN grns g ON bl.grn_id = g.id
            WHERE bl.product_id = $1
            ORDER BY bl.created_at DESC
        `, [product_id]);

        // 3. Movement History
        const logsRes = await pool.query(`
            SELECT 
                l.*, 
                u.name as created_by_name,
                a.name as approved_by_name,
                b.name as branch_name,
                g.grn_number,
                p.po_number,
                s.name as supplier_name,
                t.status as transfer_status
            FROM inventory_logs l
            JOIN users u ON l.created_by = u.id
            LEFT JOIN users a ON l.approved_by = a.id
            JOIN branches b ON l.branch_id = b.id
            LEFT JOIN grns g ON l.reference_id = g.id AND l.reference_type = 'GRN'
            LEFT JOIN purchases p ON g.purchase_id = p.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            LEFT JOIN transfers t ON l.reference_id = t.id AND l.reference_type = 'TRANSFER'
            WHERE l.product_id = $1
            ORDER BY l.timestamp DESC
        `, [product_id]);

        res.json({
            product,
            ledger: ledgerRes.rows,
            history: logsRes.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
