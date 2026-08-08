-- APPROVED: Critical-Correctness Fix Loop, item 8.4 (docs/audit/CRITICAL-CORRECTNESS-AUDIT-2026-07-06.md,
--   finding 8.4 "employees-compat-sub.service.ts's createComplaint() generates the id inline as
--   'CR-'||LPAD(CAST((SELECT COUNT(*)+1 FROM hr_conflict_reports) AS TEXT),3,'0') — a TOCTOU
--   read-max with no lock. hr_conflict_reports.id IS the PRIMARY KEY, so a collision already fails
--   loudly (23505) rather than silently duplicating -- same 'crash under concurrent load' class as
--   1.7/8.3, not silent data corruption").
--
-- Dry-run verified safe: existing rows are CR-001/002/003 (3 total) -- sequence starts at 4 so the
-- next generated id (CR-004) does not collide with any existing row.

CREATE SEQUENCE IF NOT EXISTS hr_conflict_report_seq START WITH 4 INCREMENT BY 1;
