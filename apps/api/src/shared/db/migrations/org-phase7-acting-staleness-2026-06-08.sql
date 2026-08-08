-- org-phase7-acting-staleness-2026-06-08.sql
-- ORG #02 Phase 7 — i.o./acting columns + card staleness marker. Additive, NULLABLE, idempotent.
-- APPROVED: owner 2026-06-13 (D1=closing_date reuse [no sla_days], D2=acting excluded from seat cap,
--   D3=run, D4=extend recruitment repo). Vacancy SLA reuses vacancies.closing_date (NO new column).
--
-- All columns are NULLABLE and added IF NOT EXISTS → re-running is a no-op and the existing
-- 30 employee_cards + 97 org_functions rows are untouched (is_acting reads false via default).

-- (a) i.o./acting on the canonical M:N link (employee_cards) — EP-ORG-060/061
ALTER TABLE public.employee_cards
  ADD COLUMN IF NOT EXISTS is_acting         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS acting_supplement numeric NULL;

-- (b) card staleness marker on the canonical card (org_functions) — EP-ORG-137
--     NO default: a never-reviewed card must read as stale, not "reviewed at creation".
ALTER TABLE public.org_functions
  ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz NULL;
