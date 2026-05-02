const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { hashPassword, verifyToken } = require('../utils/auth');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Auth middleware
function requireAdmin(req, res, next) {
    const token = (req.headers.authorization || '').split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    req.user = decoded;
    next();
}

// GET /api/users
router.get('/', requireAdmin, async (req, res) => {
    try {
        const { branch_id } = req.query;
        
        // Simple, safe query — no dynamic column checks needed
        let query = `
            SELECT u.id, u.name, u.email, u.is_active, u.is_superadmin,
                   u.role_id, u.branch_id, u.allowed_branches, u.allowed_modules, u.created_at,
                   r.name as role_name, b.name as branch_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN branches b ON u.branch_id = b.id
        `;
        const params = [];
        if (branch_id) {
            query += ` WHERE u.branch_id = $1`;
            params.push(branch_id);
        }
        query += ` ORDER BY u.created_at DESC`;
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users
router.post('/', requireAdmin, async (req, res) => {
    const { name, email, password, role_id, branch_id, department_id, allowed_branches, allowed_modules, is_superadmin } = req.body;
    try {
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already exists' });

        const password_hash = await hashPassword(password);
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, role_id, branch_id, department_id, allowed_branches, allowed_modules, is_superadmin)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, name, email, role_id, branch_id, is_active, is_superadmin, created_at`,
            [name, email, password_hash, role_id || null, branch_id || null, department_id || null,
             JSON.stringify(allowed_branches || []), JSON.stringify(allowed_modules || []), is_superadmin || false]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id
router.put('/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, email, password, role_id, branch_id, department_id, allowed_branches, allowed_modules, is_superadmin, is_active } = req.body;
    try {
        const updates = [];
        const params = [];
        let i = 1;

        if (name !== undefined)             { updates.push(`name=$${i++}`);              params.push(name); }
        if (email !== undefined)            { updates.push(`email=$${i++}`);             params.push(email); }
        if (password)                       { updates.push(`password_hash=$${i++}`);     params.push(await hashPassword(password)); }
        if (role_id !== undefined)          { updates.push(`role_id=$${i++}`);           params.push(role_id); }
        if (branch_id !== undefined)        { updates.push(`branch_id=$${i++}`);         params.push(branch_id); }
        if (department_id !== undefined)    { updates.push(`department_id=$${i++}`);     params.push(department_id); }
        if (allowed_branches !== undefined) { updates.push(`allowed_branches=$${i++}`);  params.push(JSON.stringify(allowed_branches)); }
        if (allowed_modules !== undefined)  { updates.push(`allowed_modules=$${i++}`);   params.push(JSON.stringify(allowed_modules)); }
        if (is_superadmin !== undefined)    { updates.push(`is_superadmin=$${i++}`);     params.push(is_superadmin); }
        if (is_active !== undefined)        { updates.push(`is_active=$${i++}`);         params.push(is_active); }

        if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

        params.push(id);
        const result = await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id=$${i} RETURNING id, name, email, is_active, is_superadmin`,
            params
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/users/:id
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM users WHERE id=$1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
