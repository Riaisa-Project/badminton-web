const db = require('../config/db');

// Helper for History
async function logHistory(userId, action, description) {
  try {
    await db.query('INSERT INTO history (user_id, action, description) VALUES ($1, $2, $3)', [userId, action, description]);
  } catch(e) {
    console.error('History log failed', e);
  }
}

// Helper for Analytics
async function updateAnalytics(dateStr, revenue, isMembership) {
  try {
    const monthYear = typeof dateStr === 'string' ? dateStr.substring(0, 7) : new Date().toISOString().substring(0,7);
    const result = await db.query('SELECT * FROM analytics WHERE month_year = $1', [monthYear]);
    if (result.rows.length === 0) {
      await db.query(
        'INSERT INTO analytics (month_year, total_revenue, regular_bookings_count, membership_bookings_count) VALUES ($1, $2, $3, $4)',
        [monthYear, revenue, isMembership ? 0 : 1, isMembership ? 1 : 0]
      );
    } else {
      await db.query(
        'UPDATE analytics SET total_revenue = total_revenue + $1, regular_bookings_count = regular_bookings_count + $2, membership_bookings_count = membership_bookings_count + $3 WHERE month_year = $4',
        [revenue, isMembership ? 0 : 1, isMembership ? 1 : 0, monthYear]
      );
    }
  } catch(e) {
    console.error('Analytics update failed', e);
  }
}

module.exports = { logHistory, updateAnalytics };
