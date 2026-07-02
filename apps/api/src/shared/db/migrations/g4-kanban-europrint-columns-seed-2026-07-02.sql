-- G4 — EUROPRINT board standart ustunlari seed (additive, idempotent)
-- APPROVED: egasi 2026-07-02 "hamma muammolarni to'g'irlash — vizyon bo'yicha"
--
-- Sabab (G4 adversarial verify topilmasi): 2026-07-01 bulk soft-delete
-- (junk-nomli "Salom/savol/1231322" ustunlar tozalovi) EUROPRINT boardida
-- BITTA ham faol ustun qoldirmagan. CC→Kanban ko'prik
-- (cc-event.listener.ts) birinchi faol ustunni `deleted_at IS NULL +
-- ORDER BY sort_order` bilan qidiradi — ustun yo'q => karta HECH QACHON
-- yaratilmaydi (ko'prik kod-tomondan tuzuq, jonli-tomondan o'lik edi).
--
-- Yechim: standart 3 ustun seed — nomlar/ranglar kanban_templates
-- default palitrasidan (91d7a60a seed bilan bir precedent, EGASI-DATA emas).
-- Idempotent: faqat EUROPRINT boardida faol ustun UMUMAN yo'q bo'lsa kiradi.
-- Junk o'chirilgan ustunlar tiklanMAYDI (Q-46 — buzuq data qaytarilmaydi).

INSERT INTO kanban_columns (board_id, name, sort_order, color, created_at, updated_at)
SELECT b.id, c.name, c.sort_order, c.color, NOW(), NOW()
FROM kanban_boards b
CROSS JOIN (VALUES
  ('Kiruvchi savat', 1, '#A0AEC0'),
  ('Jarayonda',      2, '#F5C96A'),
  ('Bajarildi',      3, '#6DC5A0')
) AS c(name, sort_order, color)
WHERE b.name = 'EUROPRINT'
  AND NOT EXISTS (
    SELECT 1 FROM kanban_columns kc
    WHERE kc.board_id = b.id AND kc.deleted_at IS NULL
  );
