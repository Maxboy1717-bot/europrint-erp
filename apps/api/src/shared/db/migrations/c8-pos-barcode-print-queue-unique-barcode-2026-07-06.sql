-- APPROVED: Critical-Correctness Fix Loop, item 8.1 (docs/audit/CRITICAL-CORRECTNESS-AUDIT-2026-07-06.md,
--   finding 8.1 "pos_barcode_print_queue.barcode = {KOD}-{YYYYMMDD}-{Math.random 6} with no UNIQUE
--   constraint; parallel Promise.all inserts, no read-back → silent duplicate barcodes that later
--   scan to the wrong item").
--
-- `pos_barcode_print_queue` is a VIEW (plain SELECT, no filter) over the real base table
-- `barcode_print_queue` — ALTER TABLE must target the base table; Postgres rejects ADD CONSTRAINT
-- on a view outright (confirmed live: "эта операция не поддерживается для представлений").
--
-- Dry-run verified safe: SELECT barcode, COUNT(*) ... HAVING COUNT(*) > 1 on barcode_print_queue
-- returned zero rows (2 total rows, no existing duplicates, no NULLs). Applied live 2026-07-06.
--
-- Paired code fix: auto-barcode.service.ts's generateForMovement() now catches a unique-violation on
-- insertBarcode() and retries with a freshly-generated random suffix (bounded attempts) instead of
-- silently succeeding with a duplicate or permanently dropping that line's barcode. This UNIQUE
-- constraint is what makes a collision detectable at all — previously it would have silently
-- succeeded.
--
-- FAQAT ADD CONSTRAINT: yangi jadval yo'q, destructive amal yo'q (no existing rows touched).
-- IF NOT EXISTS Postgres ADD CONSTRAINT'da yo'q — DO block bilan idempotent qilingan.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = 'barcode_print_queue'::regclass
      AND conname = 'uq_barcode_print_queue_barcode'
  ) THEN
    ALTER TABLE barcode_print_queue ADD CONSTRAINT uq_barcode_print_queue_barcode UNIQUE (barcode);
  END IF;
END $$;
