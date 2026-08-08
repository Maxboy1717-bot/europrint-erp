-- APPROVED: Critical-Correctness Fix Loop, item C4 (docs/audit/CRITICAL-CORRECTNESS-AUDIT-2026-07-06.md,
--   finding 1.3 "finance_invoices.invoice_number = Date.now() with no unique constraint, collision risk").
--
-- finance_invoices.invoice_number had NO uniqueness enforcement at all — two invoices created in the
-- same millisecond (e.g. a double-submit, or a burst of API calls) could collide on
-- `INV-${Date.now()}` with nothing to catch it at the DB layer.
--
-- Dry-run (rollback-tx) verified safe: SELECT invoice_number, COUNT(*) ... HAVING COUNT(*) > 1 on the
-- live table returned zero rows (no existing duplicates to violate the constraint). Applied live
-- 2026-07-06.
--
-- Paired code fix: drizzle-finance-invoice.repo.ts's saveInvoice() now generates invoice_number
-- server-side via the pre-existing (previously-dormant) `invoice_number_seq` sequence
-- (migrations-schema.ts:13-14, "MUHIM-4 fix" — created but never wired to a writer) instead of
-- trusting a caller-supplied Date.now()-based value. This UNIQUE constraint is the safety net in
-- case a future caller ever bypasses that repo method.
--
-- FAQAT ADD CONSTRAINT: yangi jadval yo'q, destructive amal yo'q (no existing rows touched).
-- Qayta ishga tushirish uchun IF NOT EXISTS yo'q (Postgres ADD CONSTRAINT'da yo'q) — DO block bilan
-- idempotent qilingan.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = 'finance_invoices'::regclass
      AND conname = 'uq_finance_invoices_invoice_number'
  ) THEN
    ALTER TABLE finance_invoices ADD CONSTRAINT uq_finance_invoices_invoice_number UNIQUE (invoice_number);
  END IF;
END $$;
