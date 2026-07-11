-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- ===========================================================================
-- Migration: sd-100-pending-material-signal-2026-07-11.sql   (2026-07-11, 06-sd#100)
-- Vision 06-sd#100 — Ojd.Syryo (Ожд.Сырьё) → Ta'minotga material signal.
--   Adds an explicit "awaiting raw material" state to the sales order: a
--   'pending_material' status plus signal columns (since + reason), so an order
--   blocked on raw material is visible to Ta'minot/MM. The SD→MM notification
--   reuses the existing OrderMaterialWaitingEvent chain (no duplicate event).
--
-- CANONICAL TARGET = sales_orders (BASE TABLE, relkind 'r').
--   sd_sales_orders is a VIEW over sales_orders (verified live 2026-07-11 via
--   pg_class.relkind='v'); NEVER ALTER the view. The view is recreated
--   (append-only) so read paths that SELECT * FROM sd_sales_orders surface the
--   two new columns.
--
-- status is a plain varchar (no PG enum), so 'pending_material' needs no ALTER TYPE;
--   the value is registered app-side in so-status.vo.ts + sales-order-transitions.constants.ts.
--
-- Default NULL -> no order is "awaiting material" -> current behavior preserved
--   for every existing row (non-regressing).
-- Idempotent: ADD COLUMN IF NOT EXISTS + CREATE OR REPLACE VIEW.
-- ===========================================================================

ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS pending_material_since timestamptz NULL;
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS pending_material_reason text NULL;

-- Recreate the read view (append-only) so sd_sales_orders exposes the columns.
CREATE OR REPLACE VIEW sd_sales_orders AS
  SELECT id, order_number, customer_id, status, total_amount, paid_amount, delivery_date, notes,
         created_at, updated_at, customer_name, document_number, distribution_channel, division,
         sold_to_party, ship_to_party, bill_to_party, requested_delivery_date, pricing_date,
         payment_terms, tax_amount, total_value, crm_deal_id, advance_paid_amount, balance_due_amount,
         advance_due_date, balance_due_date, advance_status, pp_released_at, storage_free_days,
         storage_tariff_per_m2, storage_accrued_amount, tech_routing_approved, tech_card_approved,
         tech_approved_by, tech_approved_at, tech_notes, changed_by, deleted_at, deal_id,
         advance_percent, advance_bypass_by, advance_bypass_reason, bom_checked, routing_checked,
         tech_card_checked, currency, created_by, assigned_to, company_id, advance_required,
         advance_paid, design_flag, sample_flag, is_vip, version,
         pending_material_since, pending_material_reason
    FROM sales_orders;
