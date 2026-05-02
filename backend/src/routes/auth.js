const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { hashPassword, verifyPassword, generateToken, verifyToken } = require('../utils/auth');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Initial Setup (Seed Admin & Roles)
router.post('/setup', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Step 1: Create tables if they don't exist + patch missing columns
        await client.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                permissions JSONB DEFAULT '{}'
            );
            CREATE TABLE IF NOT EXISTS branches (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                location TEXT,
                is_warehouse BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role_id INTEGER REFERENCES roles(id),
                branch_id INTEGER REFERENCES branches(id),
                allowed_branches JSONB DEFAULT '[]',
                allowed_modules JSONB DEFAULT '[]',
                is_superadmin BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                sku VARCHAR(50) UNIQUE NOT NULL,
                barcode VARCHAR(100) UNIQUE,
                name VARCHAR(200) NOT NULL,
                category VARCHAR(100),
                price DECIMAL(12, 2) NOT NULL,
                tax_percent DECIMAL(5, 2) DEFAULT 0,
                min_stock_level INTEGER DEFAULT 5,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS inventory (
                id SERIAL PRIMARY KEY,
                branch_id INTEGER REFERENCES branches(id),
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(branch_id, product_id)
            );
            CREATE TABLE IF NOT EXISTS sales (
                id SERIAL PRIMARY KEY,
                branch_id INTEGER REFERENCES branches(id),
                user_id INTEGER REFERENCES users(id),
                customer_name VARCHAR(100),
                customer_mobile VARCHAR(20),
                total_amount DECIMAL(12, 2) NOT NULL,
                tax_amount DECIMAL(12, 2) NOT NULL,
                discount_amount DECIMAL(12, 2) DEFAULT 0,
                payment_method VARCHAR(50),
                offline_id VARCHAR(100) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS sale_items (
                id SERIAL PRIMARY KEY,
                sale_id INTEGER REFERENCES sales(id),
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(12, 2) NOT NULL,
                tax_amount DECIMAL(12, 2) NOT NULL
            );
            CREATE TABLE IF NOT EXISTS transfers (
                id SERIAL PRIMARY KEY,
                from_branch_id INTEGER REFERENCES branches(id),
                to_branch_id INTEGER REFERENCES branches(id),
                status VARCHAR(50) DEFAULT 'Pending',
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                received_at TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS transfer_items (
                id SERIAL PRIMARY KEY,
                transfer_id INTEGER REFERENCES transfers(id),
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sync_log (
                id SERIAL PRIMARY KEY,
                branch_id INTEGER REFERENCES branches(id),
                sync_type VARCHAR(50),
                data JSONB,
                status VARCHAR(20) DEFAULT 'SUCCESS',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS departments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Step 1b: Patch missing columns on existing tables (safe migrations)
        await client.query(`
            ALTER TABLE roles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
            ALTER TABLE branches ADD COLUMN IF NOT EXISTS is_warehouse BOOLEAN DEFAULT FALSE;
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'branches_name_key') THEN
                    ALTER TABLE branches ADD CONSTRAINT branches_name_key UNIQUE (name);
                END IF;
            END $$;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_branches JSONB DEFAULT '[]';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_modules JSONB DEFAULT '[]';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT FALSE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id INTEGER;
        `);

        // Step 2: (Optional) Check count for logging
        const userCount = await client.query('SELECT COUNT(*) FROM users');
        console.log(`Current user count: ${userCount.rows[0].count}`);

        // Step 3: Create Default Roles (Upsert)
        const adminRole = await client.query(
            `INSERT INTO roles (name, permissions) 
             VALUES ($1, $2) 
             ON CONFLICT (name) DO UPDATE SET permissions = EXCLUDED.permissions 
             RETURNING id`,
            ['Administrator', JSON.stringify({ all: true })]
        );
        await client.query(
            `INSERT INTO roles (name, permissions) 
             VALUES ($1, $2) 
             ON CONFLICT (name) DO UPDATE SET permissions = EXCLUDED.permissions`,
            ['Warehouse Manager', JSON.stringify({ warehouse: true, inventory: true })]
        );
        await client.query(
            `INSERT INTO roles (name, permissions) 
             VALUES ($1, $2) 
             ON CONFLICT (name) DO UPDATE SET permissions = EXCLUDED.permissions`,
            ['Branch User', JSON.stringify({ pos: true, inventory: true })]
        );

        // Step 4: Create Default HQ Branch (Upsert)
        const hqBranch = await client.query(
            `INSERT INTO branches (name, location, is_warehouse) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (name) DO UPDATE SET location = EXCLUDED.location 
             RETURNING id`,
            ['Head Office & Warehouse', 'Main City', true]
        );

        // Step 5: Create Superadmin User (Upsert)
        const hashedPassword = await hashPassword('admin123');
        await client.query(
            `INSERT INTO users (name, email, password_hash, role_id, branch_id, is_superadmin, allowed_modules)
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             ON CONFLICT (email) DO UPDATE SET 
                password_hash = EXCLUDED.password_hash,
                role_id = EXCLUDED.role_id,
                branch_id = EXCLUDED.branch_id,
                is_superadmin = EXCLUDED.is_superadmin,
                allowed_modules = EXCLUDED.allowed_modules`,
            [
                'Admin', 
                'admin@orbx.com', 
                hashedPassword, 
                adminRole.rows[0].id, 
                hqBranch.rows[0].id, 
                true, 
                JSON.stringify(['dashboard', 'pos', 'products', 'inventory', 'transfers', 'customers', 'reports', 'settings'])
            ]
        );

        await client.query('COMMIT');
        res.json({ 
            message: 'Setup complete', 
            admin: { email: 'admin@orbx.com', password: 'admin123' } 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Setup error:', error);
        res.status(500).json({ error: 'Setup failed', details: error.message });
    } finally {
        client.release();
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query(`
            SELECT u.*, r.name as role_name 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            WHERE u.email = $1
        `, [email]);
        const user = result.rows[0];

        if (!user || !(await verifyPassword(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        const token = generateToken({ id: user.id, email: user.email });
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email,
                role_name: user.role_name,
                is_superadmin: !!user.is_superadmin,
                allowed_modules: user.allowed_modules || {}
            } 
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
});

// Get Current User (Me)
router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    try {
        const result = await pool.query(
            `SELECT u.*, r.name as role_name, b.name as branch_name 
             FROM users u 
             LEFT JOIN roles r ON u.role_id = r.id 
             LEFT JOIN branches b ON u.branch_id = b.id 
             WHERE u.id = $1`, 
            [decoded.id]
        );
        const user = result.rows[0];
        if (!user) return res.status(404).json({ error: 'User not found' });

        delete user.password_hash;
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user', details: error.message });
    }
});

module.exports = router;
