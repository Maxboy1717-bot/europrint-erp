-- APPROVED: egasi B13/Decision 3 (2026-07-06) -- unit_of_measures values kanonik.
--
-- ERP/MM master-data (ikkinchi slice): `products.unit` (2 qator, 'PC') va
-- `material_categories.unit` (5 qator, 'sht') "dona" (piece) kanonik koduga
-- moslashtirildi. IKKALA jadval uchun ham HECH QANDAY kod-yozish-yo'li topilmadi
-- (grep: 0 ta INSERT INTO/UPDATE/.insert()/.update() natija) -- bu FAQAT
-- ma'lumot-tuzatish, kod o'zgarishi kerak emas (hech narsa kelajakda noto'g'ri
-- qiymat kiritmaydi, chunki hech qanday yozish-yo'li yo'q).
--
-- FAQAT TUZATISH: DDL yo'q. DESTRUCTIVE amal YO'Q. Qayta ishga tushirish xavfsiz.

UPDATE products SET unit = 'dona' WHERE unit = 'PC';
UPDATE material_categories SET unit = 'dona' WHERE unit = 'sht';
