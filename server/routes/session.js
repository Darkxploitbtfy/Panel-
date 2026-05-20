const express = require('express');
const { authenticate } = require('../middleware/auth');
const { query } = require('../db');

const router = express.Router();

// POST /api/session/attach — attach a session ID to the user's account
router.post('/attach', authenticate, async (req, res) => {
  const { sessionId } = req.body || {};

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  // Basic format validation: BOTIFY-X=<hex>-<hex>
  const SESSION_RE = /^BOTIFY-X=[0-9a-f]{20}-[0-9a-f]{16}$/i;
  if (!SESSION_RE.test(sessionId.trim())) {
    return res.status(400).json({ error: 'Invalid session ID format' });
  }

  try {
    await query(
      'UPDATE users SET session_id = $1, updated_at = NOW() WHERE id = $2',
      [sessionId.trim(), req.user.id]
    );

    await query(
      `INSERT INTO runtime_events (user_id, event, message) VALUES ($1, 'attach', $2)`,
      [req.user.id, `Session attached: ${sessionId.trim()}`]
    );

    return res.json({ ok: true, sessionId: sessionId.trim() });
  } catch (err) {
    console.error('[session/attach]', err.message);
    return res.status(500).json({ error: 'Failed to attach session' });
  }
});

// DELETE /api/session/detach
router.delete('/detach', authenticate, async (req, res) => {
  try {
    await query(
      'UPDATE users SET session_id = NULL, updated_at = NOW() WHERE id = $1',
      [req.user.id]
    );
    await query(
      `INSERT INTO runtime_events (user_id, event, message) VALUES ($1, 'detach', 'Session detached')`,
      [req.user.id]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('[session/detach]', err.message);
    return res.status(500).json({ error: 'Failed to detach session' });
  }
});

module.exports = router;
