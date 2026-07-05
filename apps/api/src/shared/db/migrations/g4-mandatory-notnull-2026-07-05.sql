-- APPROVED: owner-approved via docs/audit/RESIDUAL-FIX-LOOP-2026-07-04.md G4
-- g4-mandatory-notnull-2026-07-05.sql
--
-- Sabab (G4, source: docs/audit/EXTENDED-GOVERNANCE-CHECK-2026-07-04.md item B12):
-- sales_orders.customer_id / status / total_amount and
-- finance_invoices.total_amount are only enforced as "mandatory" in
-- Zod/application code (bypassable via other write paths — see B12), not at
-- the DB level. Live-data check (2026-07-05, node _audit/q.cjs) confirmed
-- ZERO existing NULL rows for exactly these four columns:
--   sales_orders.customer_id   : 0 / 13 NULL
--   sales_orders.status        : 0 / 13 NULL
--   sales_orders.total_amount  : 0 / 13 NULL
--   finance_invoices.total_amount : 0 / 8 NULL
--
-- EXCLUDED (BLOCKED-OWNER-DATA — do NOT add here without owner-supplied
-- backfill values, existing rows would violate the constraint):
--   sales_orders.overall_status   : 12 / 13 NULL
--   sales_orders.total_value      : 13 / 13 NULL
--   sales_orders.net_value        : 13 / 13 NULL
--   sales_orders.tax_amount       : 13 / 13 NULL
--   sales_orders.document_number  : 13 / 13 NULL
--   sales_orders.order_date       : 12 / 13 NULL
--   sales_orders.pricing_date     : 13 / 13 NULL
--   finance_invoices.customer_id  : 7 / 8 NULL (invoices without a customer
--                                    are vendor/AP invoices — vendor_id set
--                                    instead; a blanket NOT NULL would be
--                                    semantically wrong here even if data
--                                    allowed it)
--
-- Run: psql $DATABASE_URL -f g4-mandatory-notnull-2026-07-05.sql
-- Dry-run proof: manual BEGIN/ROLLBACK against live DB, 2026-07-05, 0 errors.

ALTER TABLE sales_orders ALTER COLUMN customer_id SET NOT NULL;
ALTER TABLE sales_orders ALTER COLUMN status SET NOT NULL;
ALTER TABLE sales_orders ALTER COLUMN total_amount SET NOT NULL;

ALTER TABLE finance_invoices ALTER COLUMN total_amount SET NOT NULL;
