const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const { authenticateToken } = require('../utils/auth');

// Helper to ensure table structure is correct
const ensureSchema = async () => {
    try {
        // 1. Create table if missing
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
                level INTEGER DEFAULT 1,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Add columns if missing
        await pool.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE`);
        await pool.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1`);

        // 3. Update Constraints (Allow same name under different parents)
        await pool.query(`ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key`);
        
        // Check if our unique constraint exists, if not add it
        const checkConstraint = await pool.query(`
            SELECT 1 FROM pg_constraint WHERE conname = 'categories_name_parent_id_key'
        `);
        if (checkConstraint.rows.length === 0) {
            await pool.query(`ALTER TABLE categories ADD CONSTRAINT categories_name_parent_id_key UNIQUE (name, parent_id)`);
        }
    } catch (err) {
        console.error('Category schema sync error:', err.message);
    }
};

// GET /api/categories
router.get('/', authenticateToken, async (req, res) => {
    const { parent_id, level } = req.query;
    try {
        await ensureSchema();

        let query = 'SELECT * FROM categories';
        let params = [];
        let conditions = [];

        if (parent_id) {
            if (parent_id === 'null') {
                conditions.push(`parent_id IS NULL`);
            } else {
                conditions.push(`parent_id = $${params.length + 1}`);
                params.push(parent_id);
            }
        }

        if (level) {
            conditions.push(`level = $${params.length + 1}`);
            params.push(level);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY level ASC, name ASC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/categories
router.post('/', authenticateToken, async (req, res) => {
    const { name, parent_id, description } = req.body;
    try {
        await ensureSchema();
        let level = 1;
        if (parent_id) {
            const parent = await pool.query('SELECT level FROM categories WHERE id = $1', [parent_id]);
            if (parent.rows.length === 0) return res.status(400).json({ error: 'Parent category not found' });
            level = parent.rows[0].level + 1;
            if (level > 5) return res.status(400).json({ error: 'Maximum category depth is 5 levels' });
        }

        const result = await pool.query(
            'INSERT INTO categories (name, parent_id, level, description) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, parent_id || null, level, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/categories/:id
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, description, is_active } = req.body;
    try {
        await ensureSchema();
        const result = await pool.query(
            'UPDATE categories SET name=$1, description=$2, is_active=$3 WHERE id=$4 RETURNING *',
            [name, description, is_active, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/categories/:id
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
