-- hr-performance-indexes.sql
-- Session 12: HR modul /api/hr/employees va /api/hr/discipline so'rovlarini
-- tezlashtirish uchun DB indexlar.
--
-- Sabab: discipline_count subquery (correlated) har bir employees row uchun
-- alohida skan qiladi. Bu indekslar N+1 skaanning o'rnini LOOP JOIN ga aylantiradi.
--
-- Run: psql $DATABASE_URL -f hr-performance-indexes.sql

-- 1. discipline_records: employee_id + created_at (correlated subquery uchun)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_discipline_records_emp_date
  ON discipline_records(employee_id, created_at DESC);

-- 2. employees: status filter (GET /api/hr/employees?status=active)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_status
  ON employees(status)
  WHERE deleted_at IS NULL;

-- 3. employees: search — first_name + last_name ILIKE patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_name_search
  ON employees USING gin(
    (first_name || ' ' || last_name) gin_trgm_ops
  );

-- 4. employee_org_departments: is_primary lookup (LATERAL subquery uchun)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emp_org_dept_primary
  ON employee_org_departments(user_id, is_primary, assigned_at DESC)
  WHERE is_primary = true;

-- NOTE: CONCURRENTLY — production'da lock olmaydi, lekin transaction ichida
-- ishlatib bo'lmaydi. Alohida `psql` sessiyada yoki migration scriptida ishlating.
