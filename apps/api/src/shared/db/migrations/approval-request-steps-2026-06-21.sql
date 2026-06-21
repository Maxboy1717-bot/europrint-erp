-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/approval-request-steps-2026-06-21.sql
-- APPROVED: Claude (egasi vakolati) 2026-06-21
-- workflow_rules CONSUMER: persist the resolved approval chain per approval_request.
--   On POST /director/approvals, WorkflowRulesService.resolve(documentType,
--   requester.org_department_id) returns the ordered chain; one row per step here.
-- approval_requests (live) has no chain/step columns; no approval_steps table existed.
-- FK targets live-verified with PK on id: approval_requests, workflow_rules,
--   org_departments, org_functions, users.
-- Idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS approval_request_steps (
  id                     SERIAL PRIMARY KEY,
  approval_request_id    INTEGER NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  workflow_rule_id       INTEGER REFERENCES workflow_rules(id) ON DELETE SET NULL,
  step_order             INTEGER NOT NULL,
  source_department_id   INTEGER REFERENCES org_departments(id) ON DELETE SET NULL,
  approver_department_id INTEGER REFERENCES org_departments(id) ON DELETE SET NULL,
  approver_function_id   INTEGER REFERENCES org_functions(id) ON DELETE SET NULL,
  status                 VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending|approved|rejected|skipped
  acted_by_user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  acted_at               TIMESTAMPTZ,
  notes                  TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT approval_request_steps_uq UNIQUE (approval_request_id, step_order)
);
CREATE INDEX IF NOT EXISTS idx_approval_request_steps_req
  ON approval_request_steps (approval_request_id, step_order);
CREATE INDEX IF NOT EXISTS idx_approval_request_steps_pending
  ON approval_request_steps (approval_request_id) WHERE status = 'pending';
