-- APPROVED: egasi F5 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06), 2026-07-06 --
--   "Add creator/approver columns to `finance_invoices` and `payroll_period_record`."
--
-- finance_invoices had ZERO audit-trail columns (no created_by/approved_by at all).
-- payroll_period_record already had approved_by/paid_by (workflow columns) but no created_by.
--
-- NULLABLE, no backfill: historical rows will remain NULL (cannot be fabricated -- this is
-- expected and correct per the owner's own directive text). Dry-run (rollback-tx) verified
-- safe: finance_invoices 8 rows / payroll_period_record 10 rows, all created_by NULL after
-- ALTER, no data touched. Applied live 2026-07-06.
--
-- FAQAT ALTER TABLE ADD COLUMN: yangi jadval yo'q, destructive amal yo'q. Qayta ishga
-- tushirish xavfsiz (IF NOT EXISTS).

ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS created_by INTEGER NULL;
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS approved_by INTEGER NULL;
ALTER TABLE payroll_period_record ADD COLUMN IF NOT EXISTS created_by INTEGER NULL;
