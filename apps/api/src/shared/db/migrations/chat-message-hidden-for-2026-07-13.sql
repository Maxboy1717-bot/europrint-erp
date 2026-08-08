-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/chat-message-hidden-for-2026-07-13.sql
-- Chat: "delete for me" — per-user hide state (Phase-2 #6, decision A/B).
--
-- APPROVED: owner chat Phase-2 delete-policy 2026-07-13 (Muslimbek, chat) — Q-28/Q-35
--
-- NEGA: ERP chat = rasmiy audit-kanal → xabar qatori HECH QACHON hard-delete
--   qilinmaydi (decision B, immutable). "O'zim uchun o'chirish" (decision A) shu
--   jadvalga qator qo'shadi — xabar faqat SHU foydalanuvchi ko'rinishidan
--   filtrlanadi. "Hamma uchun o'chirish" = mavjud soft-delete (chat_messages.is_deleted).
--
-- message_id INTEGER — jonli chat_messages.id (integer) ga mos (Drizzle def
--   varchar'ga drift bo'lgan — Phase-4 #23). Logical ref, FK yo'q.
-- DRY-RUN (2026-07-13, jonli europrint): jadval yo'q edi; BEGIN/CREATE/ROLLBACK toza.
-- Idempotent (IF NOT EXISTS).
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_message_hidden_for (
  id          SERIAL PRIMARY KEY,
  message_id  INTEGER NOT NULL,
  user_id     INTEGER NOT NULL,
  hidden_at   TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_chat_message_hidden_for UNIQUE (message_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_message_hidden_for_user
  ON chat_message_hidden_for (user_id);
