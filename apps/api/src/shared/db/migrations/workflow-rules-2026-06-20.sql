-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/workflow-rules-2026-06-20.sql
-- APPROVED: Claude (egasi vakolati) 2026-06-20
-- Horizontal cross-department workflow routing config (Vysotskiy-7 GORIZONTAL).
--   Vision: docs/migration/02-vysotskiy-7-tree.md:151-156
--     "Gorizontal: Bo'lim -> tegishli bo'lim (config: workflow_rules jadval)"
--     e.g. Avans ariza: Sales>Sales Manager -> Finance>Accounting>Cashier
--          Material so'rovi: PROD>Prod Manager -> Tech Support>Warehouse Manager
-- Model: ONE ROW PER STEP in an approval chain. A chain is identified by
--   (request_type, source_department_id); its steps are ordered by step_order.
--   Each step names the approving department and/or function.
-- FK targets live-verified: org_departments(id int, 144 rows), org_functions(id int, 97 rows).
-- Not seeded: admins define real chains via the CRUD UI (dept/function ids are
--   data-specific). Empty table => resolve returns an empty chain (graceful).
-- Idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS workflow_rules (
  id                     SERIAL PRIMARY KEY,
  request_type           VARCHAR(50) NOT NULL,            -- e.g. 'advance_request','material_request'
  name                   VARCHAR(200),                    -- human label for the chain/step
  source_department_id   INTEGER REFERENCES org_departments(id) ON DELETE CASCADE,
  source_function_id     INTEGER REFERENCES org_functions(id) ON DELETE SET NULL,
  step_order             INTEGER NOT NULL DEFAULT 1,      -- position within the chain (1,2,3,...)
  approver_department_id INTEGER REFERENCES org_departments(id) ON DELETE SET NULL,
  approver_function_id   INTEGER REFERENCES org_functions(id) ON DELETE SET NULL,
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- one approver row per step within a (request_type, source) chain
  CONSTRAINT workflow_rules_step_uq UNIQUE (request_type, source_department_id, step_order)
);

-- resolve(request_type, source_department_id) -> ordered active steps
CREATE INDEX IF NOT EXISTS idx_workflow_rules_resolve
  ON workflow_rules (request_type, source_department_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_workflow_rules_active
  ON workflow_rules (is_active);
