-- APPROVED: owner 2026-07-13 — "Xabardan Task Yaratish" → haqiqiy Kanban karta +
-- xabar bog'lami. Egasi AskUserQuestion'da "Ikkalasi: Kanban karta + xabar bog'lami"
-- variantini tanladi. chat_message_tasks endi yaratilgan Kanban kartaga link saqlaydi
-- (message_id → kanban_card_id) traceability uchun. Idempotent (ADD COLUMN IF NOT EXISTS).
ALTER TABLE chat_message_tasks ADD COLUMN IF NOT EXISTS kanban_card_id INTEGER;
