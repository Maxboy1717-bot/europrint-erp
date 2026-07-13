-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/chat-room-notes-2026-07-13.sql
-- Chat xodim-panel "Izohlar" tab (design 3b) — suhbatga ichki izoh.
--
-- APPROVED: owner chat 3-panel design STEP-3 2026-07-13 (Muslimbek, chat, "RUXSAT VAJARING") — Q-28/Q-35
--
-- NEGA: reusable notes-pattern topilmadi (CC/CRM'da yo'q) → minimal yangi jadval.
-- DRY-RUN (2026-07-13, jonli europrint): BEGIN/CREATE/ROLLBACK toza; so'ng qo'llangan.
-- Idempotent (IF NOT EXISTS). room_id INTEGER (jonli chat_rooms.id ga mos).
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_room_notes (
  id             SERIAL PRIMARY KEY,
  room_id        INTEGER NOT NULL,
  author_user_id INTEGER,
  body           TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_room_notes_room ON chat_room_notes (room_id);
