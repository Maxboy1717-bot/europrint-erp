-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/hr-payroll-periods-hr-view-2026-06-20.sql
-- APPROVED: Claude (egasi vakolati) 2026-06-20
-- Fix: GET /api/hr/payroll-runs returned 503.
--   drizzle-hr.repo.ts:228 has a raw-SQL literal `FROM payroll_periods_hr`
--   (a COUNT + read-only SELECT). Every OTHER reference uses the Drizzle const
--   `payroll_periods_hr` which is actually bound to the physical table
--   `payroll_periods` (pgTable('payroll_periods', ...)) — those already work.
--   So the ONLY break is the missing relation name `payroll_periods_hr`.
-- Solution: a VIEW over the canonical `payroll_periods` so the raw literal reads
--   the SAME data (no duplicate store, no drift — Q-46 canonical reuse).
-- Read-only object: the literal does only COUNT(*) + SELECT ... ORDER BY ... LIMIT.
-- ============================================================

CREATE OR REPLACE VIEW payroll_periods_hr AS
  SELECT
    id,
    period_name,
    status,
    total_payroll_amount,
    employee_count,
    period_start_date,
    period_end_date,
    created_at,
    closed_at
  FROM payroll_periods;
