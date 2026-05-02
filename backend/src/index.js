require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const pool = require('./utils/db');

const initDB = async () => {
    const schema = `
        CREATE TABLE IF NOT EXISTS departments (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            permissions JSONB DEFAULT '{}'
        );

        CREATE TABLE IF NOT EXISTS branches (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            location TEXT,
            address TEXT,
            is_warehouse BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role_id INTEGER REFERENCES roles(id),
            branch_id INTEGER REFERENCES branches(id),
            department_id INTEGER REFERENCES departments(id),
            allowed_branches JSONB DEFAULT '[]',
            allowed_modules JSONB DEFAULT '{}',
            is_superadmin BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS salespersons (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE,
            phone VARCHAR(20),
            branch_id INTEGER REFERENCES branches(id),
            commission_percent DECIMAL(5, 2) DEFAULT 0,
            target_amount DECIMAL(12, 2) DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Studio Tables
        CREATE TABLE IF NOT EXISTS studio_stages (
            id SERIAL PRIMARY KEY,
            module VARCHAR(50) NOT NULL,
            name VARCHAR(100) NOT NULL,
            color VARCHAR(20) DEFAULT '#6366f1',
            sort_order INTEGER DEFAULT 0,
            is_final_win BOOLEAN DEFAULT FALSE,
            is_final_lost BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS studio_tabs (
            id SERIAL PRIMARY KEY,
            module VARCHAR(50) NOT NULL,
            name VARCHAR(100) NOT NULL,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS studio_fields (
            id SERIAL PRIMARY KEY,
            tab_id INTEGER REFERENCES studio_tabs(id) ON DELETE CASCADE,
            module VARCHAR(50) NOT NULL,
            field_name VARCHAR(100) NOT NULL,
            field_label VARCHAR(100) NOT NULL,
            field_type VARCHAR(50) NOT NULL,
            placeholder TEXT,
            options JSONB DEFAULT '[]',
            required BOOLEAN DEFAULT FALSE,
            width VARCHAR(20) DEFAULT 'full',
            visibility_rule JSONB DEFAULT 'null',
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS studio_sequences (
            id SERIAL PRIMARY KEY,
            module VARCHAR(50) UNIQUE NOT NULL,
            prefix VARCHAR(20),
            suffix VARCHAR(20),
            padding INTEGER DEFAULT 4,
            current_value INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS studio_stage_rules (
            id SERIAL PRIMARY KEY,
            module VARCHAR(50),
            field_name VARCHAR(100),
            stage_id INTEGER REFERENCES studio_stages(id) ON DELETE CASCADE,
            condition_operator VARCHAR(50),
            condition_value TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS customers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            phone VARCHAR(20) UNIQUE NOT NULL,
            email VARCHAR(100),
            address TEXT,
            credit_balance DECIMAL(12, 2) DEFAULT 0,
            loyalty_points INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sales (
            id SERIAL PRIMARY KEY,
            offline_id VARCHAR(50) UNIQUE,
            branch_id INTEGER REFERENCES branches(id),
            user_id INTEGER REFERENCES users(id),
            customer_id INTEGER REFERENCES customers(id),
            subtotal DECIMAL(12, 2) NOT NULL,
            tax_total DECIMAL(12, 2) NOT NULL,
            discount_amt DECIMAL(12, 2) DEFAULT 0,
            total_amount DECIMAL(12, 2) NOT NULL,
            payment_mode VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sale_items (
            id SERIAL PRIMARY KEY,
            sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
            product_id INTEGER NOT NULL,
            qty INTEGER NOT NULL,
            price DECIMAL(12, 2) NOT NULL,
            tax DECIMAL(5, 2) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS transfers (
            id SERIAL PRIMARY KEY,
            from_branch_id INTEGER REFERENCES branches(id),
            to_branch_id INTEGER REFERENCES branches(id),
            items INTEGER NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            notes TEXT,
            created_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
            cost_price DECIMAL(12, 2) NOT NULL,
            tax_percent DECIMAL(5, 2) DEFAULT 0,
            total DECIMAL(12, 2) NOT NULL
        );

        INSERT INTO studio_sequences (module, prefix, padding) VALUES ('purchases', 'PO-2026-', 4) ON CONFLICT DO NOTHING;

        INSERT INTO roles (name) VALUES ('Admin') ON CONFLICT DO NOTHING;
        INSERT INTO roles (name) VALUES ('Warehouse') ON CONFLICT DO NOTHING;
        INSERT INTO roles (name) VALUES ('Branch User') ON CONFLICT DO NOTHING;

        -- Ensure columns exist in existing tables
        DO $$ 
        BEGIN 
            -- Users Table Updates
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='department_id') THEN
                ALTER TABLE users ADD COLUMN department_id INTEGER REFERENCES departments(id);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='allowed_branches') THEN
                ALTER TABLE users ADD COLUMN allowed_branches JSONB DEFAULT '[]';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='allowed_modules') THEN
                ALTER TABLE users ADD COLUMN allowed_modules JSONB DEFAULT '{}';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login') THEN
                ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
            END IF;

            -- Branches Table Updates
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='address') THEN
                ALTER TABLE branches ADD COLUMN address TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='is_active') THEN
                ALTER TABLE branches ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
            END IF;
        END $$;
    `;
    try {
        await pool.query(schema);
        console.log('Database initialized');
    } catch (err) {
        console.error('Database init error:', err.message);
    }
};

const authRoutes = require('./routes/auth');
const syncRoutes = require('./routes/sync');
const inventoryRoutes = require('./routes/inventory');
const posRoutes = require('./routes/pos');
const transferRoutes = require('./routes/transfers');
const productRoutes = require('./routes/products');
const usersRoutes = require('./routes/users');
const branchesRoutes = require('./routes/branches');
const rolesRoutes = require('./routes/roles');
const departmentsRoutes = require('./routes/departments');
const salespersonsRoutes = require('./routes/salespersons');
const customersRoutes = require('./routes/customers');
const reportsRoutes = require('./routes/reports');
const studioRoutes = require('./routes/studio');
const suppliersRoutes = require('./routes/suppliers');
const purchasesRoutes = require('./routes/purchases');

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/salespersons', salespersonsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/studio', studioRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/purchases', purchasesRoutes);

app.get('/', (req, res) => {
    res.send('Orbx Retail ERP API is running...');
});

app.listen(PORT, async () => {
    await initDB();
    console.log(`Server running on port ${PORT}`);
});
