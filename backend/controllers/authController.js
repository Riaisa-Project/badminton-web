const bcrypt = require('bcrypt');
const db = require('../config/db');
const { logHistory } = require('../utils/helpers');

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Hash the password using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const { rows } = await db.query(
      'INSERT INTO users (name, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone, is_admin',
      [name, email, phone, hashedPassword]
    );
    await logHistory(rows[0].id, 'Register', 'User registered an account');
    res.status(201).json(rows[0]);
  } catch(e) {
    res.status(400).json({ error: 'Registration failed or email already exists' });
  }
};

exports.login = async (req, res) => {
  try {
    const { name, password } = req.body;
    
    // Ambil user berdasarkan nama atau email
    const { rows } = await db.query('SELECT id, name, email, phone, is_admin, password as hashed_password FROM users WHERE (name = $1 OR email = $1)', [name]);
    
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    
    const user = rows[0];
    
    // Verifikasi password dengan bcrypt
    const match = await bcrypt.compare(password, user.hashed_password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    // Hapus field password dari object user sebelum dikirim ke client
    delete user.hashed_password;

    await logHistory(user.id, 'Login', 'User logged in');
    res.json(user);
  } catch(e) {
    res.status(500).json({ error: 'Login error' });
  }
};
