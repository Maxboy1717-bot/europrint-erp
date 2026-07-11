-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 06-sd #118 (TASDIQ-2146 §06 #68) — Rulonnye samokleyki (self-adhesive roll) rulon parametrlari.
--   Rulon-mahsulot (product_type='roll') uchun o'zak (core) diametri, gilza diametri va rulon uzunligi
--   kotirovka-qatoriga (sd_quotation_items) yoziladi. Bu ustunlar YO'Q edi (to'liq column-dump tasdiqladi).
--   Sof qo'shimcha (IF NOT EXISTS); hamma ustun nullable → mavjud qatorlar regress emas (NULL qoladi,
--   box-mahsulotlarga ta'sirsiz). setItemRollParams UPDATE yozadi, getQuotationItems SELECT qaytaradi;
--   qiymatlar per-order operator tomonidan kiritiladi (egasi-DATA/threshold/GL kerak emas).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sd_quotation_items' AND column_name='core_diameter_mm') THEN
    ALTER TABLE sd_quotation_items ADD COLUMN core_diameter_mm numeric(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sd_quotation_items' AND column_name='gilza_diameter_mm') THEN
    ALTER TABLE sd_quotation_items ADD COLUMN gilza_diameter_mm numeric(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sd_quotation_items' AND column_name='roll_length_m') THEN
    ALTER TABLE sd_quotation_items ADD COLUMN roll_length_m numeric(12,2);
  END IF;
END $$;
