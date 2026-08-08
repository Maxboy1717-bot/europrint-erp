-- APPROVED: egasi B10 (2026-07-05) — "consolidate onto ONE canonical table... merge their
--   data into it. Apply to ONE dependent module first (start with MM, the smallest surface),
--   dry-run on 3-5 rows, show before/after, then run in full for that module only."
--
-- TOPILMA: material_cards (kanonik, 18 ta jadval FK bilan bog'langan) va raw_materials
--   (10 qator, allaqachon 2026-07-02'da material_card_id orqali 100% ko'prik qilingan)
--   o'rtasida asosiy ustunlar (kod/nom/kategoriya/birlik/zaxira) mos edi, LEKIN
--   material_cards.unit_price BARCHA 10 ta bog'langan qatorda NULL edi, garchi
--   raw_materials.unit_price'da haqiqiy narx bor edi (jonli tekshiruv, 2026-07-05).
--   Bu MM modulining B10 kesimidagi haqiqiy "merge data into canonical" ishi: kanonik
--   jadvalning narx-ma'lumoti to'liqlanadi, hech qanday o'qish-yo'li o'zgartirilmaydi
--   (mm-materials-extras.repository.ts, finance inventory-valuation hali ham
--   raw_materials'dan o'qiydi — bu alohida, kattaroq savol: kategoriya-taksonomiya
--   ikkalasida boshqacha, shuning uchun o'qish-yo'lini almashtirish alohida egasi-qarorini
--   talab qiladi, RESIDUAL-FIX-LOOP-2026-07-04.md "B10" bo'limiga qarang).
--
-- FAQAT ADDITIV: idempotent UPDATE..WHERE unit_price IS NULL. DDL yo'q (ustun allaqachon
--   mavjud). DESTRUCTIVE amal YO'Q. Qayta ishga tushirish xavfsiz (0 qator ta'sirlanadi
--   agar allaqachon to'ldirilgan bo'lsa). Dry-run (rollback-tx) 10/10 qator TASDIQLANDI,
--   keyin to'liq qo'llanildi (10/10 qator, jonli DB, 2026-07-05).

UPDATE material_cards mc
SET unit_price = rm.unit_price
FROM raw_materials rm
WHERE rm.material_card_id = mc.id
  AND mc.unit_price IS NULL
  AND rm.unit_price IS NOT NULL;
