-- APPROVED: egasi B13/Decision 3 (2026-07-06) -- "the canonical spelling for every unit
--   is whatever is already stored in the unit_of_measures table... make every hardcoded
--   unit string in the 74 affected columns/UI locations match this table exactly."
--
-- SD MODUL (birinchi, eng kichik slice): sales_order_items.unit ikkala jonli qatorda
-- 'PC' edi (drizzle-sales-order.repo.ts:72'dagi default-qiymat orqali kiritilgan) --
-- unit_of_measures'dagi "dona" (piece) kanonik kodiga moslashtirildi.
-- customer_order_items.unit -- 0 qator, kod-yo'li topilmadi (o'lik/ishlatilmagan), tegilmadi.
--
-- FAQAT ADDITIV/TUZATISH: DDL yo'q, faqat mavjud qator qiymatini yangilash. DESTRUCTIVE
-- amal YO'Q. Qayta ishga tushirish xavfsiz (0 qator ta'sirlanadi agar allaqachon 'dona').

UPDATE sales_order_items SET unit = 'dona' WHERE unit = 'PC';
