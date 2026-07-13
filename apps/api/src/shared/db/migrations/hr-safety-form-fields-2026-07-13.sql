-- APPROVED: owner directive 2026-07-13 (Muslimbek, chat) -- HR Nazorat 4-page fix
-- (Xavfsizlik / Sog'liq Nazorati, hr-safety.controller.ts).
--
-- artifacts/erp-dashboard/src/pages/HRSafetyDialogs.tsx TrainingDialog falls back to a
-- free-text training name when no LMS course exists yet (courses.length === 0) --
-- safety_training_records had no column for it, so hr-compat-safety.controller.ts
-- createSafetyTraining() silently dropped the value on submit (Q-40/Q-43 fake-save).
--
-- Same dialogs' ZoneDialog collects `location` (required) and `hazardType` (required,
-- a free-text hazard category e.g. "electrical"/"chemical" -- distinct from hazard_level's
-- low/medium/high/critical severity enum) and `description` (optional) -- hazard_zones had
-- no columns for any of the three, so createHazardZone() silently dropped them too.
--
-- Human-readable mirror of the entries appended to SCHEMA_MIGRATIONS in
-- apps/api/src/shared/db/invariants/migrations-schema.ts (the actual boot-time loader --
-- this file is documentation only, re-run is idempotent via IF NOT EXISTS).

ALTER TABLE IF EXISTS safety_training_records ADD COLUMN IF NOT EXISTS training_name TEXT;
ALTER TABLE IF EXISTS hazard_zones ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE IF EXISTS hazard_zones ADD COLUMN IF NOT EXISTS hazard_type TEXT;
ALTER TABLE IF EXISTS hazard_zones ADD COLUMN IF NOT EXISTS description TEXT;

-- verified live: training_id was NOT NULL, which made the training_name free-text
-- fallback unreachable (any insert with no course selected still violated NOT NULL).
-- employee_id stays NOT NULL (a training record must always name who was trained).
ALTER TABLE IF EXISTS safety_training_records ALTER COLUMN training_id DROP NOT NULL;
