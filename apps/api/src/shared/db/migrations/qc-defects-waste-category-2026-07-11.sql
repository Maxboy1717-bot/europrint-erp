-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Modul 09 (QC) — vision 09-qc #96: "Priladka (sozlash) braki alohida hisoblansin".
-- Setup/priladka isrofini ishlab-chiqarish (production) isrofidan ajratish uchun
-- qc_defects jadvaliga waste_category toifa ustuni qo'shiladi. Mavjud yozuvlar
-- ADD COLUMN ... DEFAULT 'production' orqali 'production' oladi (regressiya yo'q);
-- yangi setup braki 'setup' bilan belgilanadi. CHECK ikki qiymatni cheklaydi.
ALTER TABLE qc_defects ADD COLUMN IF NOT EXISTS waste_category TEXT NOT NULL DEFAULT 'production';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qc_defects_waste_category_chk') THEN
    ALTER TABLE qc_defects
      ADD CONSTRAINT qc_defects_waste_category_chk CHECK (waste_category IN ('production','setup'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_qc_defects_waste_category ON qc_defects (waste_category);
