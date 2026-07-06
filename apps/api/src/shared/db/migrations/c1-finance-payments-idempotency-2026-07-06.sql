-- APPROVED: Critical-Correctness Fix Loop, item C1 (docs/audit/CRITICAL-CORRECTNESS-AUDIT-2026-07-06.md,
--   finding 1.1/5.1 "record-payment double-spend/lost-update, no transaction, no idempotency key").
--   Owner directive text: "add an idempotency key... mirroring pos_movements.idempotencyKey."
--
-- finance_payments had NO idempotency protection at all -- a double-tap/network-retry on
-- POST /finance/payments/record could insert two payment rows for the same logical payment.
-- Mirrors the existing, already-proven pos_movements.idempotency_key pattern (nullable column +
-- partial unique index so old/idempotency-less callers are unaffected and multiple NULLs are
-- still allowed).
--
-- Dry-run (rollback-tx) verified safe: finance_payments 0 rows (nothing to backfill); a second
-- dry-run proved the paired atomic guarded UPDATE this fix also introduces on finance_invoices
-- (application-code only, no DDL needed there -- paid_amount/total_amount already exist) rejects
-- an overpay attempt with 0 rows affected as expected. Applied live 2026-07-06.
--
-- FAQAT ALTER TABLE ADD COLUMN + CREATE UNIQUE INDEX: yangi jadval yo'q, destructive amal yo'q.
-- Qayta ishga tushirish xavfsiz (IF NOT EXISTS).

ALTER TABLE finance_payments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100) NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_finance_payments_idempotency_key
  ON finance_payments(idempotency_key) WHERE idempotency_key IS NOT NULL;
