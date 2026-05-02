const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── STAGES ──────────────────────────────────────────────────────────────────

router.get('/stages/:module', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM studio_stages WHERE module = $1 ORDER BY sort_order ASC', [req.params.module]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/stages', async (req, res) => {
    const { module, name, color, sort_order, is_final_win, is_final_lost } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO studio_stages (module, name, color, sort_order, is_final_win, is_final_lost) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [module, name, color, sort_order, is_final_win, is_final_lost]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/stages/:id', async (req, res) => {
    const { name, color, sort_order, is_final_win, is_final_lost } = req.body;
    try {
        const result = await pool.query(
            'UPDATE studio_stages SET name=$1, color=$2, sort_order=$3, is_final_win=$4, is_final_lost=$5 WHERE id=$6 RETURNING *',
            [name, color, sort_order, is_final_win, is_final_lost, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/stages/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM studio_stages WHERE id = $1', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── LAYOUT (TABS & FIELDS) ──────────────────────────────────────────────────

router.get('/layout/:module/tabs', async (req, res) => {
    try {
        const tabs = await pool.query('SELECT * FROM studio_tabs WHERE module = $1 ORDER BY sort_order ASC', [req.params.module]);
        for (let tab of tabs.rows) {
            const fields = await pool.query('SELECT * FROM studio_fields WHERE tab_id = $1 ORDER BY sort_order ASC', [tab.id]);
            tab.fields = fields.rows;
        }
        res.json(tabs.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/layout/:module/tabs', async (req, res) => {
    const { name, sort_order } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO studio_tabs (module, name, sort_order) VALUES ($1, $2, $3) RETURNING *',
            [req.params.module, name, sort_order]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/layout/:module/fields', async (req, res) => {
    const { tab_id, field_name, field_label, field_type, placeholder, options, required, width, visibility_rule, sort_order } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO studio_fields 
            (tab_id, module, field_name, field_label, field_type, placeholder, options, required, width, visibility_rule, sort_order) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [tab_id, req.params.module, field_name, field_label, field_type, placeholder, JSON.stringify(options), required, width, JSON.stringify(visibility_rule), sort_order]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── SEQUENCES ──────────────────────────────────────────────────────────────

router.get('/sequence/:module', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM studio_sequences WHERE module = $1', [req.params.module]);
        res.json(result.rows[0] || { module: req.params.module, prefix: '', suffix: '', padding: 4 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/sequence/:module', async (req, res) => {
    const { prefix, suffix, padding } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO studio_sequences (module, prefix, suffix, padding) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (module) DO UPDATE SET prefix=EXCLUDED.prefix, suffix=EXCLUDED.suffix, padding=EXCLUDED.padding 
             RETURNING *`,
            [req.params.module, prefix, suffix, padding]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
