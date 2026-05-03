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
                role_type VARCHAR(20) DEFAULT 'Branch', -- Warehouse, Branch
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
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
                level INTEGER DEFAULT 1, -- 1: Main, 2: Category, 3: Sub, 4: Group, 5: Sub Group
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, parent_id)
            );
            CREATE TABLE IF NOT EXISTS departments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS suppliers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                contact_person VARCHAR(100),
                email VARCHAR(100),
                phone VARCHAR(20),
                address TEXT,
                gstin VARCHAR(20),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS purchases (
                id SERIAL PRIMARY KEY,
                po_number VARCHAR(50) UNIQUE NOT NULL,
                supplier_id INTEGER REFERENCES suppliers(id),
                branch_id INTEGER REFERENCES branches(id),
                status VARCHAR(20) DEFAULT 'pending', -- pending, received, cancelled
                subtotal DECIMAL(12, 2) DEFAULT 0,
                tax_total DECIMAL(12, 2) DEFAULT 0,
                total_amount DECIMAL(12, 2) DEFAULT 0,
                notes TEXT,
                created_by INTEGER REFERENCES users(id),
                received_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS purchase_items (
                id SERIAL PRIMARY KEY,
                purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
                product_id INTEGER NOT NULL,
                qty INTEGER NOT NULL,
                received_qty INTEGER DEFAULT 0,
                cost_price DECIMAL(12, 2) NOT NULL,
                tax_percent DECIMAL(5, 2) DEFAULT 0,
                attributes JSONB DEFAULT '{}',
                total DECIMAL(12, 2) NOT NULL
            );
            CREATE TABLE IF NOT EXISTS grns (
                id SERIAL PRIMARY KEY,
                purchase_id INTEGER REFERENCES purchases(id),
                grn_number VARCHAR(50) UNIQUE NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                barcode_config JSONB DEFAULT '{}',
                created_by INTEGER REFERENCES users(id),
                approved_by INTEGER REFERENCES users(id),
                received_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS grn_items (
                id SERIAL PRIMARY KEY,
                grn_id INTEGER REFERENCES grns(id) ON DELETE CASCADE,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                attributes JSONB DEFAULT '{}',
                barcodes JSONB DEFAULT '[]'
            );
            CREATE TABLE IF NOT EXISTS inventory_logs (
                id SERIAL PRIMARY KEY,
                product_id INTEGER NOT NULL,
                branch_id INTEGER NOT NULL,
                action_type VARCHAR(50) NOT NULL,
                qty_change INTEGER NOT NULL,
                reference_type VARCHAR(50),
                reference_id INTEGER,
                created_by INTEGER REFERENCES users(id),
                approved_by INTEGER REFERENCES users(id),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Step 1b: Patch missing columns on existing tables (safe migrations)
        await client.query(`
            ALTER TABLE roles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
            ALTER TABLE roles ADD COLUMN IF NOT EXISTS role_type VARCHAR(20) DEFAULT 'Branch';
            ALTER TABLE branches ADD COLUMN IF NOT EXISTS is_warehouse BOOLEAN DEFAULT FALSE;
            ALTER TABLE branches ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
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
            ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);
            ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}';
            ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS received_qty INTEGER DEFAULT 0;
        `);

        // Step 2: (Optional) Check count for logging
        const userCount = await client.query('SELECT COUNT(*) FROM users');
        console.log(`Current user count: ${userCount.rows[0].count}`);

        // Step 3: Create Default Roles (Upsert)
        await client.query(
            `INSERT INTO roles (name, role_type, permissions) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (name) DO UPDATE SET permissions = EXCLUDED.permissions, role_type = EXCLUDED.role_type`,
            ['Warehouse Admin', 'Warehouse', JSON.stringify({ 
                products: ['view', 'create', 'edit'], 
                purchases: ['view', 'create', 'edit', 'receive'], 
                inventory: ['view', 'adjust', 'transfer'],
                transfers: ['view', 'create', 'dispatch'],
                billing: ['view', 'create'],
                reports: ['view_all'],
                users: ['view', 'create', 'edit']
            })]
        );
        await client.query(
            `INSERT INTO roles (name, role_type, permissions) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (name) DO UPDATE SET permissions = EXCLUDED.permissions, role_type = EXCLUDED.role_type`,
            ['Warehouse Staff', 'Warehouse', JSON.stringify({ 
                products: ['view'], 
                purchases: ['view', 'create'], 
                inventory: ['view', 'transfer'],
                transfers: ['view', 'dispatch'],
                billing: ['view'],
                reports: ['view_own'],
                users: []
            })]
        );
        await client.query(
            `INSERT INTO roles (name, role_type, permissions) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (name) DO UPDATE SET permissions = EXCLUDED.permissions, role_type = EXCLUDED.role_type`,
            ['Branch Manager', 'Branch', JSON.stringify({ 
                products: ['view'], 
                purchases: ['view'], 
                inventory: ['view'],
                transfers: ['view', 'receive'],
                billing: ['view', 'create', 'cancel'],
                reports: ['view_own'],
                users: ['view']
            })]
        );
        await client.query(
            `INSERT INTO roles (name, role_type, permissions) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (name) DO UPDATE SET permissions = EXCLUDED.permissions, role_type = EXCLUDED.role_type`,
            ['Branch Cashier', 'Branch', JSON.stringify({ 
                products: ['view'], 
                purchases: [], 
                inventory: ['view'],
                transfers: ['view', 'receive'],
                billing: ['view', 'create'],
                reports: ['view_own'],
                users: []
            })]
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
        const waRole = await client.query("SELECT id FROM roles WHERE name = 'Warehouse Admin'");
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
                waRole.rows[0].id, 
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
            SELECT u.*, r.name as role_name, r.permissions, r.role_type, b.is_warehouse, b.name as branch_name 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            LEFT JOIN branches b ON u.branch_id = b.id
            WHERE u.email = $1
        `, [email]);
        const user = result.rows[0];

        if (!user || !(await verifyPassword(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        const token = generateToken({ 
            id: user.id, 
            email: user.email, 
            is_superadmin: !!user.is_superadmin,
            is_warehouse: !!user.is_warehouse,
            role_type: user.role_type,
            permissions: user.permissions
        });

        res.json({ 
            token, 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email,
                role_name: user.role_name,
                role_type: user.role_type,
                permissions: user.permissions || {},
                is_superadmin: !!user.is_superadmin,
                is_warehouse: !!user.is_warehouse,
                branch_id: user.branch_id,
                branch_name: user.branch_name,
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

// Maintenance: Clear Demo Data (Superadmin Only)
router.post('/reset-demo-data', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.is_superadmin) {
        return res.status(403).json({ error: 'Superadmin access required' });
    }

    try {
        console.log('Resetting demo data...');
        // Order: items first due to FK, then main tables
        await pool.query('TRUNCATE sale_items, sales, purchase_items, purchases, transfers, inventory, products RESTART IDENTITY CASCADE');
        res.json({ message: 'Inventory and transaction data cleared successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Reset failed', details: error.message });
    }
});

module.exports = router;
