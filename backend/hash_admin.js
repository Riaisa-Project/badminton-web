const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function run() {
  try {
    const h = await bcrypt.hash('admingor', 10);
    console.log('Hashed password:', h);
    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [h, 'admin@gor.com']);
    console.log('Admin password updated successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

run();
