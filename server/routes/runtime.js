const express = require('express');
const { authenticate } = require('../middleware/auth');
const { callCore } = require('../middleware/coreProxy');
const { query } = require('../db');

const router = express.Router();

function requireSession(req, res, next) {
  if (!req.user.session_id) {
    return res.status(400).json({ error: 'No session ID attached. Attach one first.' });
  }
  next();
}

async function logEvent(userId, event, message) {
  try {
    await query(
      'INSERT INTO runtime_events (user_id, event, message) VALUES ($1, $2, $3)',
      [userId, event, message]
    );
  } catch {}
}

// POST /api/runtime/start
router.post('/start', authenticate, requireSession, async (req, res) => {
  const { session_id } = req.user;
  const result = await callCore('POST', `/runtime/${session_id}/start`, { userId: req.user.id });
  await logEvent(req.user.id, 'start', result.ok ? 'Runtime started' : result.data?.error);
  return res.status(result.status).json(result.data);
});

// POST /api/runtime/restart
router.post('/restart', authenticate, requireSession, async (req, res) => {
  const { session_id } = req.user;
  const result = await callCore('POST', `/runtime/${session_id}/restart`, { userId: req.user.id });
  await logEvent(req.user.id, 'restart', result.ok ? 'Runtime restarted' : result.data?.error);
  return res.status(result.status).json(result.data);
});

// POST /api/runtime/stop
router.post('/stop', authenticate, requireSession, async (req, res) => {
  const { session_id } = req.user;
  const result = await callCore('POST', `/runtime/${session_id}/stop`, { userId: req.user.id });
  await logEvent(req.user.id, 'stop', result.ok ? 'Runtime stopped' : result.data?.error);
  return res.status(result.status).json(result.data);
});

// GET /api/runtime/status
router.get('/status', authenticate, requireSession, async (req, res) => {
  const { session_id } = req.user;
  const result = await callCore('GET', `/runtime/${session_id}/status`);
  return res.status(result.status).json(result.data);
});

// GET /api/runtime/logs
router.get('/logs', authenticate, requireSession, async (req, res) => {
  const { session_id } = req.user;
  const result = await callCore('GET', `/runtime/${session_id}/logs`);
  return res.status(result.status).json(result.data);
});

// GET /api/runtime/events — local audit log (last 30 events)
router.get('/events', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT event, message, created_at FROM runtime_events
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
      [req.user.id]
    );
    return res.json({ events: rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
});

module.exports = router;
