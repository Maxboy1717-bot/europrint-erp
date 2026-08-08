-- APPROVED: egasi ikki-dunyo-tuzatish 2026-07-02
-- TOPILMA: raw_materials (10 qator) material_cards bilan sinxronlanmagan eski dublikat —
--   material_card_id ustuni 100% NULL edi, garchi FK (raw_materials_material_card_id_fkey ->
--   material_cards(id) ON DELETE SET NULL) allaqachon mavjud bo'lsa ham.
--   raw_materials.code va material_cards.kod bo'yicha 1:1 mos keladi (10/10, hech qanday
--   dublikat/mos kelmagan yozuv yo'q — 2026-07-02 tekshiruvda tasdiqlangan).
--
-- FAQAT ADDITIV: idempotent UPDATE..WHERE material_card_id IS NULL. DDL yo'q (ustun+FK
-- allaqachon mavjud). DESTRUCTIVE amal YO'Q. Qayta ishga tushirish xavfsiz.

UPDATE raw_materials rm
SET material_card_id = mc.id
FROM material_cards mc
WHERE mc.kod = rm.code
  AND rm.material_card_id IS NULL;
