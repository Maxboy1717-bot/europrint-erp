-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/chat-employee-panel-schema-2026-07-13.sql
-- Chat 3-panel inbox redesign — employee info panel schema (design STEP 2).
--
-- APPROVED: owner chat 3-panel design-spec 2026-07-13 (Muslimbek, chat) — Q-28/Q-35
--
-- 1) chat_user_presence.work_status — ish-holati (ishda/band/tushlikda/
--    tatilda/tashqarida), ONLINE/OFFLINE socket-presence'dan alohida. Nullable.
-- 2) chat_room_tags — suhbat teglari (Muhim/Kutilmoqda/Tezkor…). room_id INTEGER
--    (jonli chat_rooms.id ga mos). UNIQUE(room_id, tag).
--
-- DRY-RUN (2026-07-13, jonli europrint): BEGIN/ALTER+CREATE/ROLLBACK toza; so'ng qo'llangan.
-- Idempotent (IF NOT EXISTS).
-- ============================================================

ALTER TABLE chat_user_presence ADD COLUMN IF NOT EXISTS work_status VARCHAR(20);

CREATE TABLE IF NOT EXISTS chat_room_tags (
  id         SERIAL PRIMARY KEY,
  room_id    INTEGER NOT NULL,
  tag        VARCHAR(40) NOT NULL,
  created_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_chat_room_tags UNIQUE (room_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_chat_room_tags_room ON chat_room_tags (room_id);
