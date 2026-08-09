-- ==========================================================
-- PostgreSQL Database Schema for Cafe POS Tablet & Web Menu
-- ==========================================================

-- ENUM types
CREATE TYPE user_role AS ENUM ('kasir', 'admin');
CREATE TYPE session_status AS ENUM ('aktif', 'ditutup');
CREATE TYPE order_status AS ENUM ('menunggu', 'diproses', 'selesai', 'dibatalkan');
CREATE TYPE order_channel AS ENUM ('self_order', 'pos_manual');
CREATE TYPE table_status AS ENUM ('kosong', 'terisi');
CREATE TYPE payment_method AS ENUM ('tunai', 'QRIS', 'EDC');

-- Tabel users
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'kasir',
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel tables (meja fisik)
CREATE TABLE IF NOT EXISTS tables (
    table_id SERIAL PRIMARY KEY,
    table_number VARCHAR(10) UNIQUE NOT NULL,
    status table_status DEFAULT 'kosong'
);

-- Tabel menu_items
CREATE TABLE IF NOT EXISTS menu_items (
    item_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    description TEXT,
    photo_url TEXT,
    stock_status VARCHAR(20) DEFAULT 'tersedia'
);

-- Tabel sessions (pakai UUID untuk keamanan)
CREATE TABLE IF NOT EXISTS sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id INTEGER NOT NULL REFERENCES tables(table_id),
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status session_status DEFAULT 'aktif'
);

-- Tabel orders
CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    order_time TIMESTAMPTZ DEFAULT NOW(),
    status order_status DEFAULT 'menunggu',
    channel order_channel NOT NULL
);

-- Tabel order_items
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES menu_items(item_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    notes TEXT,
    subtotal DECIMAL(10,2) NOT NULL
);

-- Tabel payments
CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(session_id),
    payment_method payment_method NOT NULL,
    nominal DECIMAL(10,2) NOT NULL,
    payment_time TIMESTAMPTZ DEFAULT NOW(),
    kasir_id INTEGER NOT NULL REFERENCES users(user_id),
    subtotal DECIMAL(10,2) NOT NULL,
    service_charge DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL
);

-- Tabel stock_changes_log
CREATE TABLE IF NOT EXISTS stock_changes_log (
    log_id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES menu_items(item_id),
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by INTEGER NOT NULL REFERENCES users(user_id),
    reason TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel tax_service_config
CREATE TABLE IF NOT EXISTS tax_service_config (
    config_id SERIAL PRIMARY KEY,
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    service_charge_percentage DECIMAL(5,2) DEFAULT 0,
    is_tax_active BOOLEAN DEFAULT false,
    is_service_active BOOLEAN DEFAULT false,
    effective_date TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_time ON orders(order_time);
CREATE INDEX IF NOT EXISTS idx_payments_payment_time ON payments(payment_time);
