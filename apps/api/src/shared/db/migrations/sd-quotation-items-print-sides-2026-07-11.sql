-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- ============================================================================
-- SD #145 — Bez oborota / s oborotom (one/two-sided print) 2x cost factor
-- Vision: TASDIQ-2146 §06 #95 (06-sd #145)
-- ----------------------------------------------------------------------------
-- Per-line 1|2 sides selector on sd_quotation_items (KANONIK, STANDARTLAR §15).
-- Default 1 = one-sided -> existing rows and quoted prices unchanged (no regression).
-- calculatePrice multiplies printCost by this factor (two-sided doubles plates + run).
-- Idempotent: ADD COLUMN IF NOT EXISTS + guarded CHECK add.
-- ============================================================================

ALTER TABLE sd_quotation_items ADD COLUMN IF NOT EXISTS print_sides smallint NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sd_quotation_items_print_sides_check') THEN
    ALTER TABLE sd_quotation_items
      ADD CONSTRAINT sd_quotation_items_print_sides_check CHECK (print_sides IN (1, 2));
  END IF;
END $$;
