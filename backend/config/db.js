const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Required for Neon PostgreSQL
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    };

const pool = new Pool(poolConfig);

// Initialize database table if it doesn't exist
const initDb = async () => {
  try {
    const initSqlPath = path.join(__dirname, '../../database/init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    await pool.query(initSql);
    console.log('Database initialized successfully from init.sql.');
  } catch (err) {
    console.error('Error initializing database:', err.message);
  }
};

initDb();

module.exports = {
  query: (text, params) => pool.query(text, params),
};
