-- APPROVED: egasi vizyon-qurish 2026-07-01, FAZA Kanban 3-savat real CC (M0)
-- Test-axlat tozalash: jonli DB'da topilgan test kartochka/ustun/board nomlari
-- ("Salom"/"savol"/"1231322"/"as"/"sALOM"/"SADSD"/"SDSD"/"Nima") — audit
-- (docs/audit/VIZYON-TEKSHIRUV-2026-06-27/15-kanban.md) tomonidan aniqlangan.
-- Soft-delete (deleted_at) ishlatiladi — barcha o'qish so'rovlari allaqachon
-- `WHERE deleted_at IS NULL` filtridan foydalanadi (regressiya yo'q, Q-39/Q-46);
-- ma'lumot fizik o'chirilmaydi, faqat yashiriladi — kerak bo'lsa tiklanadi.
-- Idempotent: barcha UPDATE `AND deleted_at IS NULL` bilan qo'riqlangan.

-- 1) Board id=1 ("as") — to'liq test board, hech qanday jonli karta unga bog'lanmagan.
UPDATE kanban_boards
SET deleted_at = NOW()
WHERE id = 1 AND name = 'as' AND deleted_at IS NULL;

-- 2) Board 1 ning barcha ustunlari (as/salom/sALOM/SADSD/SDSD/SALOM) — junk board bilan birga.
UPDATE kanban_columns
SET deleted_at = NOW()
WHERE board_id = 1 AND deleted_at IS NULL;

-- 3) Board 2 (EUROPRINT, jonli/kanonik board) dagi test-ustunlar — "Birinchi bosqich"
--    (legit birinchi bosqich) SAQLANADI, faqat aniq test-nomlar o'chiriladi.
UPDATE kanban_columns
SET deleted_at = NOW()
WHERE board_id = 2
  AND name IN ('Salom', 'savol', '1231322')
  AND deleted_at IS NULL;

-- 4) Test-kartochkalar ("Salom"/"Nima") — ikkalasi ham test-axlat ustunlariga
--    bog'langan yoki test-mazmunli sarlavha bilan yaratilgan.
UPDATE kanban_cards
SET deleted_at = NOW()
WHERE title IN ('Salom', 'Nima') AND deleted_at IS NULL;
