const pool = require('./src/utils/db');

async function clearData() {
    try {
        console.log('Clearing demo data...');
        // Order matters due to foreign keys
        const tables = [
            'sale_items',
            'sales',
            'purchase_items',
            'purchases',
            'transfers',
            'inventory',
            'products'
        ];
        
        for (const table of tables) {
            console.log(`Truncating ${table}...`);
            await pool.query(`TRUNCATE ${table} RESTART IDENTITY CASCADE`);
        }
        
        console.log('Inventory and Transactions cleared successfully!');
    } catch (err) {
        console.error('Error clearing data:', err.message);
    } finally {
        await pool.end();
    }
}

clearData();
