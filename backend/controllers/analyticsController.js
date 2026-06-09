const db = require('../config/db');

exports.getAnalytics = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM analytics ORDER BY month_year DESC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT h.*, u.name as user_name 
      FROM history h 
      JOIN users u ON h.user_id = u.id 
      ORDER BY h.created_at DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};
