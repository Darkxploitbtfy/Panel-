const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '12h' });
}

// POST /api/auth/register  — requires valid invite token
router.post('/register', async (req, res) => {
  const { username, password, inviteToken } = req.body || {};

  if (!username || !password || !inviteToken) {
    return res.status(400).json({ error: 'username, password and inviteToken are required' });
  }
  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({ error: 'username must be 3–50 characters' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'password must be at least 8 characters' });
  }

  try {
    // Validate invite token
    const { rows: tokens } = await query(
      'SELECT * FROM invite_tokens WHERE token = $1 AND used = false AND expiry_date > NOW()',
      [inviteToken]
    );
    if (!tokens.length) {
      return res.status(403).json({ error: 'Invalid, expired, or already-used invite token' });
    }

    const invite = tokens[0];

    // Check username not taken
    const { rows: existing } = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.length) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const hash = await bcrypt.hash(password, 12);

    // Create user with expiry from invite token
    const { rows: users } = await query(
      `INSERT INTO users (username, password_hash, expiry_date, plan)
       VALUES ($1, $2, $3, $4) RETURNING id, username, expiry_date, plan`,
      [username, hash, invite.expiry_date, invite.plan]
    );
    const user = users[0];

    // Mark token as used
    await query(
      'UPDATE invite_tokens SET used = true, used_by = $1 WHERE id = $2',
      [user.id, invite.id]
    );

    return res.status(201).json({ token: signToken(user.id), user });
  } catch (err) {
    console.error('[auth/register]', err.message);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    const { rows } = await query(
      'SELECT id, username, password_hash, session_id, expiry_date, is_active, plan FROM users WHERE username = $1',
      [username]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }
    if (new Date(user.expiry_date) < new Date()) {
      return res.status(403).json({ error: 'Account has expired' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password_hash, ...safeUser } = user;
    return res.json({ token: signToken(user.id), user: safeUser });
  } catch (err) {
    console.error('[auth/login]', err.message);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
