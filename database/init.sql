-- 1. Tabel Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Courts (Data Lapangan)
CREATE TABLE IF NOT EXISTS courts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    price_per_hour NUMERIC NOT NULL
);

-- 3. Tabel Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    court_id INT REFERENCES courts(id),
    booking_date VARCHAR(100) NOT NULL, -- Mendukung 'YYYY-MM-DD s/d YYYY-MM-DD'
    start_time VARCHAR(10) NOT NULL, -- HH:MM
    end_time VARCHAR(10) NOT NULL, -- HH:MM
    type VARCHAR(20) DEFAULT 'Regular', -- 'Regular' or 'Membership'
    status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Confirmed', 'Cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    booking_id INT REFERENCES bookings(id),
    total_price NUMERIC NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Paid', 'Failed', 'Cancelled'
    payment_method VARCHAR(50),
    payment_proof TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Payments
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(50) REFERENCES transactions(id),
    payment_method VARCHAR(50) NOT NULL,
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel History
CREATE TABLE IF NOT EXISTS history (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel Analytics
CREATE TABLE IF NOT EXISTS analytics (
    id SERIAL PRIMARY KEY,
    month_year VARCHAR(10) UNIQUE NOT NULL, -- Format: YYYY-MM
    total_revenue NUMERIC DEFAULT 0,
    regular_bookings_count INT DEFAULT 0,
    membership_bookings_count INT DEFAULT 0
);

-- Seed Data: Courts
INSERT INTO courts (name, price_per_hour)
VALUES 
    ('Lapangan 1', 50000),
    ('Lapangan 2', 50000),
    ('Lapangan 3', 50000)
ON CONFLICT DO NOTHING;

-- Seed Data: Admin User (Password is 'admingor')
INSERT INTO users (name, email, phone, password, is_admin)
VALUES ('Admin', 'admin@gor.com', '081234567890', '$2b$10$CNl6bb14yBJ..WoSLBIdX.6yYsU961tc11JbreE0ohDYWj4UbNyyO', TRUE)
ON CONFLICT (email) DO NOTHING;
