-- APPROVED: egasi 2026-07-09 (owner-decisions batch item 7 — granular notification_type_preferences)
-- FILE: apps/api/src/shared/db/migrations/notification-type-preferences-2026-07-09.sql
-- Granular per-type × per-channel notification preferences.
--   The NotificationSettings page renders a matrix (notification_type × {email, telegram, inApp}).
--   Before this table the matrix was silently dropped on save — only the 9 flat booleans in
--   notification_preferences persisted. This table stores one row per (user, type, channel).
-- Mirrors ensureNotificationTables() in apps/api/src/common/database/ddl-migrations.ts (created on boot).
-- Idempotent (CREATE TABLE IF NOT EXISTS); no data migration needed (build phase, 0 live rows).

CREATE TABLE IF NOT EXISTS notification_type_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, notification_type, channel)
);
