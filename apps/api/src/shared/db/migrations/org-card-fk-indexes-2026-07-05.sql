-- APPROVED: owner-approved via docs/audit/RESIDUAL-FIX-LOOP-2026-07-04.md G3
-- org-card-fk-indexes-2026-07-05.sql
--
-- Sabab (G3, source: docs/audit/EXTENDED-GOVERNANCE-CHECK-2026-07-04.md item A6):
-- Canonical org-card FK ustunlarida index yo'q, sequential scan majburlaydi:
--   employees.org_department_id, employees.org_function_id,
--   org_functions.razryad_level_id
-- Ularning DEPRECATED juftlari (employees.department_id / employees.position_id)
-- allaqachon indekslangan (idx_employees_dept, idx_employees_position) — bu
-- assimetriya jonli pg_indexes so'rovi bilan tasdiqlangan (2026-07-05).
--
-- CONCURRENTLY: bu loyihada migratsiyalar `psql -f <fayl>.sql` orqali alohida
-- sessiyada qo'llaniladi (transaction-wrapped runner yo'q — BOSHLASH.md, mavjud
-- namuna: hr-performance-indexes.sql), shuning uchun CONCURRENTLY xavfsiz va
-- production lock oldini oladi.
--
-- Run: psql $DATABASE_URL -f org-card-fk-indexes-2026-07-05.sql

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_org_department_id
  ON employees(org_department_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_org_function_id
  ON employees(org_function_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_org_functions_razryad_level_id
  ON org_functions(razryad_level_id);
