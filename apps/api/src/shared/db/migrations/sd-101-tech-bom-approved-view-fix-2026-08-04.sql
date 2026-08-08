-- ===========================================================================
-- Migration: sd-101-tech-bom-approved-view-fix-2026-08-04.sql
-- Vision gap (2026-08-03 discovery sweep): "Tech-checkpoint tasdig'i saqlanmaydi
-- -- golden-thread SD->PP amalda hech qachon ochilmaydi".
--
-- Root cause part 1/2 (this file): the sd_sales_orders VIEW (recreated by
-- sd-100-pending-material-signal-2026-07-11.sql) exposes tech_routing_approved
-- and tech_card_approved but was MISSING tech_bom_approved -- so even a
-- correctly-persisted tech_bom_approved=true on the base sales_orders table
-- could never be read back by DrizzleSalesOrderRepository.findById()
-- (`SELECT * FROM sd_sales_orders`), which is how the SalesOrder aggregate is
-- rehydrated on every ApproveTechCheckpointCommand. isThreeCheckpointPassed()
-- would therefore stay false forever for the BOM leg, regardless of writes.
-- (Root cause part 2/2 = execSdSalesOrderUpdate now also persisting the 3
-- flags -- see apps/api/src/common/database/queries-sd.ts.)
--
-- CANONICAL TARGET = sales_orders (BASE TABLE, relkind 'r'); tech_bom_approved
--   already exists there (lib/db/src/schema/sd-orders.ts:183) -- no new column,
--   no new table. Only the read VIEW's SELECT list is being widened.
--
-- Postgres CREATE OR REPLACE VIEW requires the existing column list to stay
--   IDENTICAL in name/order/type; new columns may only be APPENDED at the end
--   (same append-only convention as sd-100). tech_bom_approved is therefore
--   added at the very end of the SELECT list, not inlined next to its sibling
--   tech_routing_approved/tech_card_approved columns.
-- Idempotent: CREATE OR REPLACE VIEW.
-- ===========================================================================

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
         pending_material_since, pending_material_reason, tech_bom_approved
    FROM sales_orders;
