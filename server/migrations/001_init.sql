-- BOTIFY X Client Panel — initial schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(50)  UNIQUE NOT NULL,
  password_hash TEXT         NOT NULL,
  session_id    VARCHAR(120) DEFAULT NULL,
  expiry_date   TIMESTAMPTZ  NOT NULL,
  is_active     BOOLEAN      DEFAULT true,
  plan          VARCHAR(50)  DEFAULT 'basic',
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- Invite tokens table
CREATE TABLE IF NOT EXISTS invite_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token        VARCHAR(120) UNIQUE NOT NULL,
  used         BOOLEAN      DEFAULT false,
  used_by      UUID         REFERENCES users(id) ON DELETE SET NULL,
  expiry_date  TIMESTAMPTZ  NOT NULL,
  plan         VARCHAR(50)  DEFAULT 'basic',
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- Runtime event log (lightweight audit trail)
CREATE TABLE IF NOT EXISTS runtime_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         REFERENCES users(id) ON DELETE CASCADE,
  event      VARCHAR(50)  NOT NULL,  -- start | stop | restart | attach | error
  message    TEXT         DEFAULT NULL,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_users_username    ON users(username);
CREATE INDEX IF NOT EXISTS idx_runtime_user_id   ON runtime_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invite_token      ON invite_tokens(token);
