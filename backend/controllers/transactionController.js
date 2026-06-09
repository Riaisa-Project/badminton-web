const db = require('../config/db');
const { logHistory, updateAnalytics } = require('../utils/helpers');

exports.getTransactions = async (req, res) => {
  try {
    const query = `
      SELECT t.id, t.total_price as "totalVal", t.status, t.payment_method as "paymentMethod", t.payment_proof as "paymentProof",
             b.booking_date as "dateStr", b.start_time as "startVal", b.end_time as "endVal", b.type,
             c.id as court, u.name as "userName", u.phone
      FROM transactions t
      JOIN bookings b ON t.booking_id = b.id
      JOIN courts c ON b.court_id = c.id
      JOIN users u ON b.user_id = u.id
      ORDER BY t.created_at DESC
    `;
    const { rows } = await db.query(query);
    res.json(rows);
  } catch(e) {
    res.status(500).json({ error: 'Fetch failed' });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const { id, userName, phone, court, dateStr, startVal, endVal, totalVal, status, paymentMethod, paymentProof } = req.body;
    
    // Find or create user
    let userRes = await db.query('SELECT id FROM users WHERE name = $1', [userName]);
    let userId;
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
    } else {
      const newUser = await db.query('INSERT INTO users (name, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING id', [userName, `guest_${Date.now()}@temp.com`, phone, 'guest123']);
      userId = newUser.rows[0].id;
    }
    
    const isMembership = dateStr.includes('s/d');
    const type = isMembership ? 'Membership' : 'Regular';
    
    // Convert totalVal "Rp 100.000" to numeric
    const numericTotal = parseInt(totalVal.replace(/[^0-9]/g, '')) || 0;
    
    await db.query('BEGIN');
    
    const bookingRes = await db.query(
      'INSERT INTO bookings (user_id, court_id, booking_date, start_time, end_time, type, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [userId, court, dateStr, startVal, endVal, type, status || 'Pending']
    );
    const bookingId = bookingRes.rows[0].id;
    
    const trxRes = await db.query(
      'INSERT INTO transactions (id, booking_id, total_price, status, payment_method, payment_proof) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, bookingId, numericTotal, status || 'Pending', paymentMethod || 'Transfer', paymentProof || null]
    );
    
    await logHistory(userId, 'Create Booking', `Created booking for court ${court} on ${dateStr}`);
    
    await db.query('COMMIT');
    res.status(201).json(trxRes.rows[0]);
  } catch(e) {
    await db.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ error: 'Create transaction failed' });
  }
};

exports.updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await db.query('BEGIN');
    
    const trxRes = await db.query('UPDATE transactions SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    if (trxRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }
    const trx = trxRes.rows[0];
    const bookingId = trx.booking_id;
    
    let bookingStatus = 'Pending';
    if (status === 'Lunas') bookingStatus = 'Confirmed';
    else if (status === 'Dibatalkan') bookingStatus = 'Cancelled';
    
    const bookingRes = await db.query('UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *', [bookingStatus, bookingId]);
    const booking = bookingRes.rows[0];
    
    if (status === 'Lunas') {
      await db.query('INSERT INTO payments (transaction_id, payment_method, amount) VALUES ($1, $2, $3)', [id, trx.payment_method || 'Cash', trx.total_price]);
      await updateAnalytics(booking.booking_date, trx.total_price, booking.type === 'Membership');
    }
    
    await logHistory(booking.user_id, 'Update Transaction', `Transaction ${id} status updated to ${status}`);
    
    await db.query('COMMIT');
    res.json({ success: true, status });
  } catch(e) {
    await db.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ error: 'Update status failed' });
  }
};

exports.deleteTransactions = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    await db.query('BEGIN');
    
    // Get booking IDs first
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const trxRes = await db.query(`SELECT booking_id FROM transactions WHERE id IN (${placeholders})`, ids);
    const bookingIds = trxRes.rows.map(r => r.booking_id);

    // 1. Delete payments
    await db.query(`DELETE FROM payments WHERE transaction_id IN (${placeholders})`, ids);
    
    // 2. Delete transactions
    await db.query(`DELETE FROM transactions WHERE id IN (${placeholders})`, ids);
    
    // 3. Delete bookings
    if (bookingIds.length > 0) {
      const bPlaceholders = bookingIds.map((_, i) => `$${i + 1}`).join(', ');
      await db.query(`DELETE FROM bookings WHERE id IN (${bPlaceholders})`, bookingIds);
    }
    
    await db.query('COMMIT');
    res.json({ success: true, message: 'Deleted successfully' });
  } catch(e) {
    await db.query('ROLLBACK');
    console.error('Delete error:', e);
    res.status(500).json({ error: 'Delete failed' });
  }
};
