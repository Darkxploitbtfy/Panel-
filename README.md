# BOTIFY X — Client Panel

Secure user control panel for managing already-linked BOTIFY X sessions.

## Architecture Overview

```
┌─────────────────────┐       HTTP/WS        ┌─────────────────────┐
│  Client Panel       │ ──────────────────▶  │  BOTIFY X CORE      │
│  (this project)     │                       │  (your bot runtime) │
│                     │  POST /runtime/:id/start
│  - Auth             │  POST /runtime/:id/restart
│  - Access control   │  POST /runtime/:id/stop
│  - Runtime UI       │  GET  /runtime/:id/status
│                     │  GET  /runtime/:id/logs
└─────────────────────┘                       └─────────────────────┘
         │
         │ PostgreSQL
         ▼
  users, invite_tokens,
  runtime_events
```

The Client Panel never touches Baileys or WhatsApp sockets directly. It delegates all runtime operations to **BOTIFY X CORE** via a simple HTTP API.

---

## Quick Start (Railway)

1. Create a new Railway project
2. Add a **PostgreSQL** plugin — Railway sets `DATABASE_URL` automatically
3. Upload this folder
4. Set environment variables (see below)
5. Deploy — Railway uses `railway.json` for build + start commands

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | Auto (Railway) | Server port |
| `DATABASE_URL` | Yes | PostgreSQL connection string (Railway sets automatically) |
| `JWT_SECRET` | Yes | Long random string — `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `CORE_API_URL` | Yes | Base URL of BOTIFY X CORE (e.g. `https://your-core.railway.app`) |
| `CORE_API_SECRET` | Recommended | Shared secret passed as `X-Botify-Secret` header to CORE |
| `NODE_ENV` | Recommended | Set to `production` |

---

## BOTIFY X CORE — Required API Contract

Your CORE must expose these endpoints. The panel calls them with:
- Header: `X-Botify-Secret: <CORE_API_SECRET>`
- Header: `Content-Type: application/json`

```
POST   /runtime/:sessionId/start     → { status: "running" }
POST   /runtime/:sessionId/restart   → { status: "restarting" }
POST   /runtime/:sessionId/stop      → { status: "stopped" }
GET    /runtime/:sessionId/status    → { status: "running"|"stopped"|"restarting"|"connecting"|"unknown" }
GET    /runtime/:sessionId/logs      → { logs: ["line1", "line2", ...] }
```

---

## Database

The migration runs automatically on startup. To run manually:

```bash
psql $DATABASE_URL -f server/migrations/001_init.sql
```

---

## Creating Invite Tokens (Admin SQL)

Until the admin dashboard is built, create invite tokens directly in Postgres:

```sql
-- Create an invite token valid for 30 days, basic plan
INSERT INTO invite_tokens (token, expiry_date, plan)
VALUES (
  'BX-INVITE-' || encode(gen_random_bytes(16), 'hex'),
  NOW() + INTERVAL '30 days',
  'basic'
);

-- View all unused tokens
SELECT token, plan, expiry_date FROM invite_tokens WHERE used = false;
```

---

## Future: Admin Dashboard

The schema is already prepared. The admin dashboard will plug in to:

- `invite_tokens` — create/revoke tokens
- `users` — manage accounts, expiry, plans, active status
- `runtime_events` — audit trail

---

## Local Development

```bash
# Install server deps
npm install

# Start server (needs DATABASE_URL + JWT_SECRET in .env)
npm run dev

# In another terminal — start client dev server
cd client && npm install && npm run dev
```

Copy `.env.example` to `.env` and fill in values before running.
