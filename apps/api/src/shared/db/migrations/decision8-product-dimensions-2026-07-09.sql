-- APPROVED: egasi (owner, Muslimbek) 2026-07-09 — DECISION 8 follow-up (owner: "hammasini tugating").
--   Tayyor-mahsulot maydon/m² (ijara-taymer areaM2) uchun jismoniy o'lchamlar manbai YO'Q edi (owner-data-gap).
--   products ga length_mm / width_mm / height_mm (numeric, nullable) qo'shiladi -> areaM2 = length_mm × width_mm
--   / 1e6 × amount hisoblanadi (receive-fg.handler._resolveAreaM2ForProduct). Qiymatlar hozircha NULL bo'lib
--   qoladi (master-data — egasi kiritadi); u holda resolver halol undefined (pending) qaytaradi, fabrikatsiya emas.
--   Sof qo'shimcha (IF NOT EXISTS). Boshqa jadvalga tegmaydi.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='length_mm') THEN
    ALTER TABLE products ADD COLUMN length_mm numeric(12,3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='width_mm') THEN
    ALTER TABLE products ADD COLUMN width_mm numeric(12,3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='height_mm') THEN
    ALTER TABLE products ADD COLUMN height_mm numeric(12,3);
  END IF;
END $$;
