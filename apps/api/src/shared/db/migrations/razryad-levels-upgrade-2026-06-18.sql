-- APPROVED: owner (2026-06-18)
-- razryad-levels-upgrade-2026-06-18.sql
-- Adds coefficient/name_uz/name_ru/min_months/description_uz to razryad_levels.
-- The original table (org-phase1-canonical-card-2026-06-08.sql) only had:
--   name, min_requirement, salary_min, salary_max, exam_type, certificate, description.
-- The seed-02-razryad.sql expects the new column set — this migration bridges the gap.
-- Idempotent: ADD COLUMN IF NOT EXISTS.

BEGIN;

ALTER TABLE razryad_levels
  ADD COLUMN IF NOT EXISTS name_uz       TEXT,
  ADD COLUMN IF NOT EXISTS name_ru       TEXT,
  ADD COLUMN IF NOT EXISTS coefficient   NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS min_months    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description_uz TEXT;

-- Backfill: copy existing name → name_uz (if not yet set)
UPDATE razryad_levels
  SET name_uz = name
  WHERE name_uz IS NULL AND name IS NOT NULL;

-- Backfill: copy existing description → description_uz (if not yet set)
UPDATE razryad_levels
  SET description_uz = description
  WHERE description_uz IS NULL AND description IS NOT NULL;

-- Default coefficients for levels that already exist but have no coefficient yet
-- (matches seed-02-razryad.sql values: 1→1.00, 2→1.25, 3→1.55, 4→1.90, 5→2.30, 6→2.80)
UPDATE razryad_levels SET coefficient = 1.00 WHERE level = 1 AND coefficient IS NULL;
UPDATE razryad_levels SET coefficient = 1.25 WHERE level = 2 AND coefficient IS NULL;
UPDATE razryad_levels SET coefficient = 1.55 WHERE level = 3 AND coefficient IS NULL;
UPDATE razryad_levels SET coefficient = 1.90 WHERE level = 4 AND coefficient IS NULL;
UPDATE razryad_levels SET coefficient = 2.30 WHERE level = 5 AND coefficient IS NULL;
UPDATE razryad_levels SET coefficient = 2.80 WHERE level = 6 AND coefficient IS NULL;

COMMIT;

-- Tekshirish:
-- SELECT id, level, name_uz, coefficient, min_months FROM razryad_levels ORDER BY level;
