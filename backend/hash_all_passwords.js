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
    const { rows } = await pool.query('SELECT id, password FROM users');
    let updated = 0;
    for (const user of rows) {
      // Check if password is not a bcrypt hash (bcrypt hashes start with $2b$, $2a$, or $2y$)
      if (!user.password.startsWith('$2')) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
        updated++;
      }
    }
    console.log(`Successfully updated ${updated} plaintext passwords to bcrypt hashes.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

run();
