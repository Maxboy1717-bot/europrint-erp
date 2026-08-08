-- ============================================================================
-- MM-11 #11.25 — mm_purchase_orders: Incoterms/delivery-terms field
-- ============================================================================
-- APPROVED: owner Q-35 schema-approval wave 2026-07-11 (blanket approval for harvested
--   Phase-2 build-queue items — see memory project_schema_approval_wave_2026_07_11.md).
--   Additive, non-destructive — Q-46 compliant.
--
-- WHAT: purchase_orders (base table) gets a new nullable delivery_terms text column
--   (free-text Incoterm / delivery-terms note, e.g. "EXW Toshkent", "DAP Buxoro 5 kun ichida").
--   mm_purchase_orders is a VIEW over purchase_orders (verified live: pg_class.relkind='v')
--   whose explicit column list did NOT project this new column — CREATE OR REPLACE VIEW
--   appends it to the END of the existing projection (no existing column is dropped,
--   renamed, or re-ordered — the only form CREATE OR REPLACE VIEW permits, and the only
--   form allowed here).
--
-- WHY ADDITIVE-SAFE (Q-46 / DESTRUCTIVE-TABLE-DROP guard):
--   • ALTER TABLE ... ADD COLUMN IF NOT EXISTS — never touches existing columns/rows.
--   • No DROP VIEW (which would break dependent objects). CREATE OR REPLACE keeps the
--     view OID. The first 26 output columns are byte-for-byte identical (same names,
--     same order) to the current definition (verified against pg_get_viewdef); only
--     delivery_terms is appended at the end.
--   • Base table purchase_orders is otherwise untouched; the view remains a simple
--     single-relation passthrough (no DISTINCT/GROUP BY/joins) so it stays auto-updatable
--     — existing `UPDATE mm_purchase_orders SET ...` callers keep working unchanged.
--
-- IDEMPOTENT: re-runnable. ADD COLUMN IF NOT EXISTS + CREATE OR REPLACE VIEW (fixed
--   definition) are both idempotent.
-- ============================================================================

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS delivery_terms text;

CREATE OR REPLACE VIEW mm_purchase_orders AS
SELECT
  id,
  po_number,
  vendor_id,
  order_date,
  delivery_date,
  status,
  total_amount,
  currency,
  created_by,
  created_at,
  deleted_at,
  vendor_name,
  items,
  approved_by,
  approved_at,
  goods_received_by,
  goods_received_at,
  invoice_matched,
  three_way_matched,
  notes,
  updated_at,
  supplier_id,
  expected_delivery_date,
  actual_delivery_date,
  expected_date,
  reference_number,
  received_by,
  -- MM-11 #11.25 additive: Incoterms / delivery-terms free-text note
  delivery_terms
FROM purchase_orders;

-- VERIFY (run after apply):
--   SELECT relkind FROM pg_class WHERE relname='mm_purchase_orders';   -- expect 'v'
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name='purchase_orders' AND column_name='delivery_terms';    -- expect 1 row
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name='mm_purchase_orders' AND column_name='delivery_terms'; -- expect 1 row
