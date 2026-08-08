-- APPROVED: mechanical race-condition fix (item #79) — no new business rule, same pattern as
-- c17-sales-order-number-seq-2026-07-07.sql (sales_order_number_seq) and invoice_number_seq (C4).
-- PpPlanningRepository.createScheduleEntry() generated order_number via
-- CONCAT('PO-', EXTRACT(EPOCH FROM NOW())::bigint) — second-precision, not atomic: two concurrent
-- POST /planning/schedule requests within the same second collide on production_orders'
-- order_number UNIQUE constraint (production_orders_order_number_unique), failing one request.
-- A dedicated sequence (nextval) is Postgres-atomic — no application-level lock needed.
--
-- Dry-run verified safe: production_orders currently has 0 rows (full-company-reset), zero
-- collision risk starting the sequence at 1.

CREATE SEQUENCE IF NOT EXISTS pp_schedule_order_seq START WITH 1 INCREMENT BY 1;
