-- Database Schema for Orbx Retail ERP

-- Roles: Admin, Warehouse, Branch User
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSONB DEFAULT '{}'
);

-- Branches
CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    location TEXT,
    is_warehouse BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE users (
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

-- Product Master
CREATE TABLE products (
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

-- Inventory (Stock per Branch)
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, product_id)
);

-- Sales / Invoices
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id),
    user_id INTEGER REFERENCES users(id),
    customer_name VARCHAR(100),
    customer_mobile VARCHAR(20),
    total_amount DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    payment_method VARCHAR(50),
    offline_id VARCHAR(100) UNIQUE, -- ID from IndexedDB
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sale Items
CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) NOT NULL
);

-- Stock Transfers
CREATE TABLE transfers (
    id SERIAL PRIMARY KEY,
    from_branch_id INTEGER REFERENCES branches(id),
    to_branch_id INTEGER REFERENCES branches(id),
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Shipped, Received, Cancelled
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_at TIMESTAMP
);

-- Transfer Items
CREATE TABLE transfer_items (
    id SERIAL PRIMARY KEY,
    transfer_id INTEGER REFERENCES transfers(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL
);

-- Sync Log
CREATE TABLE sync_log (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id),
    sync_type VARCHAR(50), -- SALES, INVENTORY, TRANSFER
    data JSONB,
    status VARCHAR(20) DEFAULT 'SUCCESS',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Data
INSERT INTO roles (name) VALUES ('Admin'), ('Warehouse'), ('Branch User');
