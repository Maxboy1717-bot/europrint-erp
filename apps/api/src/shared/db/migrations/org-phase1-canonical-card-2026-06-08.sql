-- APPROVED: owner 2026-06-08
-- ORG Phase 1 — canonical CARD = org_functions (the real FK hub: 29 FK / employees+users link).
-- Adds the card-model columns org_functions lacks + razryad_levels master-data, then backfills
-- positions' rich columns onto org_functions by ROLE NAME (ids are not aligned between the two tables).
-- DEFERRED (with reason, see report): 1-seat-1-employee unique index (existing data has 3 employees
--   per function → needs EP-ORG-037 seat-split first) · positions→VIEW (positions has CRUD writers).

-- ============================================================
-- A) razryad_levels master-data (MASALA-2, EP-ORG-009/043)
-- ============================================================
CREATE TABLE IF NOT EXISTS razryad_levels (
  id              SERIAL PRIMARY KEY,
  level           INTEGER NOT NULL,
  name            TEXT NOT NULL,
  min_requirement TEXT,
  salary_min      NUMERIC(14,2),
  salary_max      NUMERIC(14,2),
  exam_type       TEXT,
  certificate     TEXT,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (level)
);

-- ============================================================
-- B) org_functions = canonical CARD — add the card columns it lacks (idempotent)
--    (tskp, tskp_target, tskp_measurement_unit already exist → MASALA-3 reuse)
-- ============================================================
ALTER TABLE org_functions
  ADD COLUMN IF NOT EXISTS status           TEXT NOT NULL DEFAULT 'active',          -- EP-ORG-083 (active/frozen/vacant/archived/io)
  ADD COLUMN IF NOT EXISTS deleted_at       TIMESTAMPTZ,                             -- EP-ORG-005 soft-delete
  ADD COLUMN IF NOT EXISTS razryad_level_id INTEGER REFERENCES razryad_levels(id),   -- EP-ORG-008
  ADD COLUMN IF NOT EXISTS salary_type      TEXT,                                    -- EP-ORG-024 (ishbay/soatbay/oylik)
  ADD COLUMN IF NOT EXISTS code             TEXT,                                    -- EP-ORG-037 card code
  ADD COLUMN IF NOT EXISTS level            INTEGER,
  ADD COLUMN IF NOT EXISTS rbac_tier        TEXT,                                    -- EP-ORG-023 RBAC from card
  ADD COLUMN IF NOT EXISTS min_salary       NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS max_salary       NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS ai_exam_enabled  BOOLEAN DEFAULT false,                   -- EP-ORG-046
  ADD COLUMN IF NOT EXISTS statistics_type  TEXT,
  ADD COLUMN IF NOT EXISTS manager_id       INTEGER,                                 -- EP-ORG-021 parent-card/manager
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- C) Backfill positions' rich data onto org_functions BY ROLE NAME
--    (ids are NOT aligned; dept-node numbering differs between the tables → dept+name yields only 3.
--     Name is the reliable role key: 95/97 names unique. The 2 duplicated names — "Bosh direktor",
--     "Kassir" — are EXCLUDED → left empty, never mis-mapped, per owner rule.)
-- ============================================================
UPDATE org_functions f SET
  code            = COALESCE(f.code, p.code),
  level           = COALESCE(f.level, p.level),
  rbac_tier       = COALESCE(f.rbac_tier, p.rbac_tier),
  min_salary      = COALESCE(f.min_salary, p.min_salary),
  max_salary      = COALESCE(f.max_salary, p.max_salary),
  ai_exam_enabled = COALESCE(f.ai_exam_enabled, p.ai_exam_enabled),
  statistics_type = COALESCE(f.statistics_type, p.statistics_type),
  tskp            = COALESCE(f.tskp, p.ckp),     -- positions.ckp (filled) → canonical ЦКП text (was NULL)
  updated_at      = NOW()
FROM positions p
WHERE lower(p.name_uz) = lower(f.position_name)
  AND lower(f.position_name) NOT IN ('bosh direktor', 'kassir');   -- ambiguous dup names → leave empty

-- DEFERRED to a follow-up step (each has a hard blocker — see ORG-PHASE1 report):
--   1) CREATE UNIQUE INDEX uq_employee_active_org_function ON employees(org_function_id)
--      WHERE org_function_id IS NOT NULL AND status='active';
--      → BLOCKED: org_function 11/12/14 already have 3 active employees (needs EP-ORG-037 seat-split).
--   2) CREATE OR REPLACE VIEW positions AS SELECT ... FROM org_functions ...;
--      → BLOCKED: positions has live CRUD writers (core/positions/positions.repository.ts insert/update/delete,
--        org-structure sync-helper, master-data.seed) — converting to a view breaks those writes.
