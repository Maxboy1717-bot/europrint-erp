-- aisha-tables.sql
-- AIsha (Director voice assistant) — schema migration
-- Creates 4 tables: conversations, tool_calls, voice_audit, pending_approvals.
-- Idempotent — safe to run multiple times.

CREATE TABLE IF NOT EXISTS aisha_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     INTEGER NOT NULL,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at    TIMESTAMPTZ,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS aisha_conv_user_idx   ON aisha_conversations(user_id);
CREATE INDEX IF NOT EXISTS aisha_conv_status_idx ON aisha_conversations(status);

CREATE TABLE IF NOT EXISTS aisha_tool_calls (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES aisha_conversations(id) ON DELETE CASCADE,
  tool_name       TEXT NOT NULL,
  input           JSONB NOT NULL,
  output          JSONB,
  source          TEXT,
  latency_ms      INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS aisha_tool_conv_idx ON aisha_tool_calls(conversation_id);
CREATE INDEX IF NOT EXISTS aisha_tool_name_idx ON aisha_tool_calls(tool_name);

CREATE TABLE IF NOT EXISTS aisha_voice_audit (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES aisha_conversations(id) ON DELETE CASCADE,
  transcript        TEXT NOT NULL,
  audio_deleted_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS aisha_audit_conv_idx ON aisha_voice_audit(conversation_id);

CREATE TABLE IF NOT EXISTS aisha_pending_approvals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES aisha_conversations(id) ON DELETE CASCADE,
  tool_call_id    UUID NOT NULL REFERENCES aisha_tool_calls(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending',
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS aisha_approval_conv_idx   ON aisha_pending_approvals(conversation_id);
CREATE INDEX IF NOT EXISTS aisha_approval_status_idx ON aisha_pending_approvals(status);
