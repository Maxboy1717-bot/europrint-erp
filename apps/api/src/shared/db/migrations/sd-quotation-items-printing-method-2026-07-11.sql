-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- vision 06-sd#101: "Bosma yo'nalishi Ofset/Flekso (+AI tavsiya)" — per-quotation-line
-- printing method (offset vs flexo) plus a rule-based recommendation. Additive ALTER only.
-- printing_method NULL = not yet chosen (the calculate-price AI hint fills it at quote time);
-- the CHECK allows only the two known enum values (or NULL), so every existing row keeps its
-- current NULL value with no regression. Canonical SD quotation-line table = sd_quotation_items
-- (STANDARTLAR §15 / docs/DB_ERD.md) — no dup fork.
ALTER TABLE sd_quotation_items
  ADD COLUMN IF NOT EXISTS printing_method VARCHAR(10);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'sd_quotation_items'::regclass
      AND conname  = 'sd_quotation_items_printing_method_chk'
  ) THEN
    ALTER TABLE sd_quotation_items
      ADD CONSTRAINT sd_quotation_items_printing_method_chk
      CHECK (printing_method IS NULL OR printing_method IN ('offset', 'flexo'));
  END IF;
END $$;
