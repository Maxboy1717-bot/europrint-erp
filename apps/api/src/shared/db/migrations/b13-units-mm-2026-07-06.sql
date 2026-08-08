-- APPROVED: egasi B13/Decision 3 (2026-07-06) -- unit_of_measures values kanonik.
--
-- MM MODUL (uchinchi slice): material_cards.unit_of_measure (13 qator 'sht',
-- 2 qator 'l'), raw_materials.unit (1 qator 'sht', 2 qator 'l'),
-- purchase_order_items.unit (1 qator 'sht', 1 qator 'l') -- barchasi "dona"
-- (piece) va "litr" (liter) kanonik kodlariga moslashtirildi.
--
-- KOD-TOMONI ham tuzatildi (shu partiyada): drizzle-mm.repo.ts'da
-- purchase_order_items.unit uchun HARDCODED 'sht' default topilib "dona"ga
-- almashtirildi (savePurchaseOrder(), PurchaseOrderItem domain obyektida unit
-- maydoni yo'q edi).
--
-- FAQAT TUZATISH: DDL yo'q. DESTRUCTIVE amal YO'Q. Qayta ishga tushirish xavfsiz.

UPDATE material_cards SET unit_of_measure = 'dona' WHERE unit_of_measure = 'sht';
UPDATE material_cards SET unit_of_measure = 'litr' WHERE unit_of_measure = 'l';
UPDATE raw_materials SET unit = 'dona' WHERE unit = 'sht';
UPDATE raw_materials SET unit = 'litr' WHERE unit = 'l';
UPDATE purchase_order_items SET unit = 'dona' WHERE unit = 'sht';
UPDATE purchase_order_items SET unit = 'litr' WHERE unit = 'l';
