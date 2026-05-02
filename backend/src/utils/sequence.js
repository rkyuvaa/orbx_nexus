const pool = require('./db');

async function getNextSequence(module) {
    const result = await pool.query(
        'UPDATE studio_sequences SET current_value = current_value + 1 WHERE module = $1 RETURNING *',
        [module]
    );
    if (result.rows.length === 0) return null;
    const seq = result.rows[0];
    const padded = String(seq.current_value).padStart(seq.padding, '0');
    return `${seq.prefix || ''}${padded}${seq.suffix || ''}`;
}

module.exports = { getNextSequence };
