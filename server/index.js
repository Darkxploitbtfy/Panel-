require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server: SocketServer } = require('socket.io');
const jwt = require('jsonwebtoken');

const { query } = require('./db');
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/session');
const runtimeRoutes = require('./routes/runtime');

const app = express();
const httpServer = http.createServer(app);

// ── Socket.io (for live status push) ──────────────────────────────────────────
const io = new SocketServer(httpServer, {
  cors: { origin: '*' },
  path: '/socket.io',
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Missing token'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.userId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.userId}`);
  socket.on('disconnect', () => {});
});

// Expose io so routes can push events later
app.set('io', io);

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts' },
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// ── API routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/runtime', runtimeRoutes);

app.get('/api/healthz', (req, res) => res.json({ ok: true, ts: Date.now() }));

// ── DB migration (idempotent) ──────────────────────────────────────────────────
async function migrate() {
  const fs = require('fs');
  const sql = fs.readFileSync(path.join(__dirname, 'migrations/001_init.sql'), 'utf8');
  try {
    await query(sql);
    console.log('[db] migration applied');
  } catch (err) {
    console.error('[db] migration error:', err.message);
  }
}

// ── Serve React build in production ───────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return;
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
migrate().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`[botify-x-client-panel] listening on port ${PORT}`);
  });
});
