-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/chat-client-msg-dedup-2026-07-13.sql
-- Chat: retry idempotentligi — (room_id, client_msg_id) UNIQUE indeks.
--
-- APPROVED: owner chat-audit fix Phase-1 #5 follow-up 2026-07-13 (Muslimbek, chat) — Q-28/Q-35
--
-- NEGA: Optimistik-send retry (Phase-1 #5) bir xil client_msg_id bilan qayta
--   yuborilganda, agar asl xabar allaqachon persist bo'lgan lekin echo yo'qolgan
--   bo'lsa, DB-da ikkinchi (dublikat) qator paydo bo'lishi mumkin edi. Bu indeks
--   + insert-dagi ON CONFLICT (chat-message-base.repository.ts) retry'ni mavjud
--   qatorga reconcile qiladi, dublikat yaratmaydi.
--
-- XAVFSIZLIK: Postgres UNIQUE NULLlarni DISTINCT hisoblaydi (default) — shuning
--   uchun client_msg_id NULL bo'lgan boshqa send-yo'llari (eski/fayl-yuklash)
--   HECH QACHON to'qnashmaydi; indeks faqat client-generatsiya qilingan
--   (non-null) id juftliklariga ta'sir qiladi. Partial predikat kerak emas.
--
-- DRY-RUN (2026-07-13, jonli europrint): indeks yo'q edi, chat_messages=0 satr,
--   0 bloklovchi dublikat; BEGIN/CREATE/ROLLBACK toza o'tdi. Idempotent (IF NOT EXISTS).
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_messages_room_client_msg
  ON chat_messages (room_id, client_msg_id);
