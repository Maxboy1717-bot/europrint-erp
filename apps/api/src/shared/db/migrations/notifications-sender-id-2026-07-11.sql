-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 18-notif #88 — sender_id ustuni `notifications` jadvaliga: notificationni kim (qaysi
--   foydalanuvchi) yuborganini bildiradi (originating actor). `user_id` esa kimga
--   yuborilganini bildiradi (recipient) — ular hozir bir xil emas va bir xil ustunga
--   qo'shib bo'lmaydi. Additive-only: yangi nullable integer ustun, mavjud ustunlarga
--   tegilmaydi (Q-46). NULL = tizim/cron tomonidan yuborilgan (masalan fp-cycle-cron,
--   cashier-cash-limit-alert, mm-reconciliation-digest cron'lari) — inson-actor yo'q
--   holatlarda NULL qoladi (kod ularga tegmaydi).
--   FK users(id) ON DELETE SET NULL: yuboruvchi hisobi o'chirilsa, notification
--   yozuvi o'zi o'chmaydi, faqat sender_id NULL bo'ladi.
-- Idempotent (ADD COLUMN IF NOT EXISTS — safe to re-run).

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS sender_id integer REFERENCES users(id) ON DELETE SET NULL;

COMMENT ON COLUMN notifications.sender_id IS '18-notif #88: xabarni yuborgan foydalanuvchi (originating actor); NULL = tizim/cron yuborgan.';
