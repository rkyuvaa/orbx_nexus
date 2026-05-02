const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateToken, requireWarehouse } = require('../utils/auth');

// GET all transfers
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { branch_id } = req.query;
        let query = `
            SELECT t.*, 
                   fb.name as from_branch_name, 
                   tb.name as to_branch_name,
                   u.name as created_by_name
            FROM transfers t
            JOIN branches fb ON t.from_branch_id = fb.id
            JOIN branches tb ON t.to_branch_id = tb.id
            JOIN users u ON t.created_by = u.id
        `;
        const params = [];
        if (branch_id) {
            query += ` WHERE t.from_branch_id = $1 OR t.to_branch_id = $1`;
            params.push(branch_id);
        }
        query += ` ORDER BY t.created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET transfer details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const tRes = await pool.query(
            `SELECT t.*, fb.name as from_branch_name, tb.name as to_branch_name
             FROM transfers t
             JOIN branches fb ON t.from_branch_id = fb.id
             JOIN branches tb ON t.to_branch_id = tb.id
             WHERE t.id = $1`, [req.params.id]
        );
        if (tRes.rows.length === 0) return res.status(404).json({ error: 'Transfer not found' });

        const itemsRes = await pool.query(
            `SELECT ti.*, p.name as product_name, p.sku
             FROM transfer_items ti
             JOIN products p ON ti.product_id = p.id
             WHERE ti.transfer_id = $1`, [req.params.id]
        );

        res.json({ ...tRes.rows[0], items: itemsRes.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE Transfer (Warehouse Only) - Dispatches stock from Warehouse
router.post('/', authenticateToken, requireWarehouse, async (req, res) => {
    const { to_branch_id, items, notes } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get Warehouse Branch ID (The current user's branch)
        const from_branch_id = req.user.branch_id;

        // 2. Create Transfer Header
        const tRes = await client.query(
            `INSERT INTO transfers (from_branch_id, to_branch_id, status, notes, created_by)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [from_branch_id, to_branch_id, 'shipped', notes, req.user.id]
        );
        const transfer_id = tRes.rows[0].id;

        // 3. Process Items & Deduct Stock from Warehouse
        for (const item of items) {
            // Check Warehouse Stock
            const invRes = await client.query(
                'SELECT quantity FROM inventory WHERE branch_id = $1 AND product_id = $2',
                [from_branch_id, item.product_id]
            );
            const currentStock = invRes.rows[0]?.quantity || 0;
            if (currentStock < item.quantity) {
                throw new Error(`Insufficient stock for product ID ${item.product_id} in Warehouse`);
            }

            // Deduct Stock
            await client.query(
                'UPDATE inventory SET quantity = quantity - $1 WHERE branch_id = $2 AND product_id = $3',
                [item.quantity, from_branch_id, item.product_id]
            );

            // Add to Transfer Items
            await client.query(
                'INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES ($1, $2, $3)',
                [transfer_id, item.product_id, item.quantity]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ id: transfer_id, message: 'Stock dispatched from warehouse' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// RECEIVE Transfer (Target Branch Only) - Adds stock to Branch
router.put('/:id/receive', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get Transfer
        const tRes = await client.query('SELECT * FROM transfers WHERE id = $1 FOR UPDATE', [req.params.id]);
        if (tRes.rows.length === 0) throw new Error('Transfer not found');
        
        const transfer = tRes.rows[0];
        if (transfer.status === 'received') throw new Error('Transfer already received');
        
        // Security Check: Only the destination branch can receive
        if (transfer.to_branch_id !== req.user.branch_id && !req.user.is_superadmin) {
            throw new Error('Unauthorized: You can only receive transfers destined for your branch');
        }

        // 2. Get Items
        const itemsRes = await client.query('SELECT * FROM transfer_items WHERE transfer_id = $1', [req.params.id]);

        // 3. Add stock to Branch inventory
        for (const item of itemsRes.rows) {
            await client.query(`
                INSERT INTO inventory (product_id, branch_id, quantity)
                VALUES ($1, $2, $3)
                ON CONFLICT (product_id, branch_id)
                DO UPDATE SET quantity = inventory.quantity + $3, last_updated = CURRENT_TIMESTAMP
            `, [item.product_id, transfer.to_branch_id, item.quantity]);
        }

        // 4. Update status
        await client.query(
            'UPDATE transfers SET status = $1, received_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['received', req.params.id]
        );

        await client.query('COMMIT');
        res.json({ message: 'Stock received and added to branch inventory' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;
