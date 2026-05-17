-- ============================================================================
-- 0016_add_tenant_id_to_hr_tables.sql
-- Phase 2 — Task 2.1 (HR remediation): multi-tenancy foundation.
--
-- Adds `tenant_id INTEGER NOT NULL DEFAULT 1` to the 10 HR-owned tables that
-- carry per-tenant data. Default = 1 so existing rows backfill automatically
-- and any service that bootstraps with the new column but has not yet been
-- updated to filter / inject `tenant_id` keeps producing valid INSERTs.
--
-- Approach (low-risk):
--   1. ALTER TABLE ... ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL
--      DEFAULT 1  — single-statement, idempotent. PG backfills existing rows
--      to 1 in the same operation.
--   2. CREATE INDEX IF NOT EXISTS ... ON (tenant_id, <natural_key>) — so the
--      tenant filter every query will add is index-backed from day one.
--
-- The DEFAULT is INTENTIONALLY left in place. Dropping it requires:
--   - every writer (handler, repo, raw SQL) to set tenant_id explicitly,
--   - the TenantContext middleware to be wired into the request pipeline,
--   - a follow-up migration to ALTER COLUMN ... DROP DEFAULT.
-- That cleanup is tracked as a separate task and intentionally NOT bundled
-- here so this migration can land cleanly ahead of Phases 4/5/6/7 which
-- will touch the same tables in parallel worktrees.
--
-- Tables:
--   employees, payroll_periods, salary_history, leave_requests, attendance,
--   discipline_records, candidates, vacancies, aisha_conversations,
--   aisha_tool_calls
--
-- Idempotent: `IF NOT EXISTS` guards make replay safe.
-- Single transaction: partial application impossible.
-- ============================================================================

BEGIN;

-- ─── 1. employees ──────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS employees
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_status ON employees(tenant_id, status);

-- ─── 2. payroll_periods ────────────────────────────────────────────────────
ALTER TABLE IF EXISTS payroll_periods
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_payroll_periods_tenant_id ON payroll_periods(tenant_id);

-- ─── 3. salary_history ─────────────────────────────────────────────────────
ALTER TABLE IF EXISTS salary_history
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_salary_history_tenant_id ON salary_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_salary_history_tenant_emp ON salary_history(tenant_id, employee_id);

-- ─── 4. leave_requests ─────────────────────────────────────────────────────
ALTER TABLE IF EXISTS leave_requests
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_id ON leave_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_emp ON leave_requests(tenant_id, employee_id);

-- ─── 5. attendance ─────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS attendance
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_id ON attendance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_emp_date ON attendance(tenant_id, employee_id, attendance_date);

-- ─── 6. discipline_records ─────────────────────────────────────────────────
ALTER TABLE IF EXISTS discipline_records
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_discipline_records_tenant_id ON discipline_records(tenant_id);

-- ─── 7. candidates ─────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS candidates
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_candidates_tenant_id ON candidates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_candidates_tenant_status ON candidates(tenant_id, status);

-- ─── 8. vacancies ──────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS vacancies
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_vacancies_tenant_id ON vacancies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_tenant_status ON vacancies(tenant_id, status);

-- ─── 9. aisha_conversations ────────────────────────────────────────────────
ALTER TABLE IF EXISTS aisha_conversations
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_aisha_conversations_tenant_id ON aisha_conversations(tenant_id);

-- ─── 10. aisha_tool_calls ──────────────────────────────────────────────────
ALTER TABLE IF EXISTS aisha_tool_calls
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_aisha_tool_calls_tenant_id ON aisha_tool_calls(tenant_id);

COMMIT;
