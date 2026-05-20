const jwt = require('jsonwebtoken');
const { query } = require('../db');

async function authenticate(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const { rows } = await query(
      'SELECT id, username, session_id, expiry_date, is_active, plan FROM users WHERE id = $1',
      [payload.userId]
    );
    if (!rows.length || !rows[0].is_active) {
      return res.status(403).json({ error: 'Account inactive or not found' });
    }

    const user = rows[0];
    if (new Date(user.expiry_date) < new Date()) {
      return res.status(403).json({ error: 'Account expired' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(500).json({ error: 'Auth verification failed' });
  }
}

module.exports = { authenticate };
