const db = require('../config/db');

exports.getCourts = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM courts ORDER BY id ASC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch courts' });
  }
};
