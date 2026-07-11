-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- vision 06-sd#154: "'Zakaz 1S' eski raqamni ixtiyoriy saqlash" — optional free-text legacy
-- 1C (Zakaz 1S) order number kept on the order header as a migration-bridge / cross-lookup id.
-- Additive ALTER only, on the CANONICAL SD order-header table sales_orders (ADR-002 /
-- docs/DB_ERD.md line 216 — the rival `orders` table was DROPPED; sales_orders is the single
-- SD order world). It is an OPAQUE external identifier (e.g. "УТ-00012345"), so free text —
-- NOT an enum/lookup. legacy_order_number NULL default = native order with no 1C ancestor;
-- every existing row stays NULL — no regression.
-- Idempotent: ADD COLUMN IF NOT EXISTS — safe to re-run.
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS legacy_order_number VARCHAR(64);

COMMENT ON COLUMN sales_orders.legacy_order_number IS
  'Optional legacy 1C (Zakaz 1S) order number — migration-bridge free text, NULL for native orders (vision 06-sd#154)';
