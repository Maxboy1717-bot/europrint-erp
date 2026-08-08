-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- "Mahsulot vs Buyurtma zanjiri" gap (owner decision 2026-07-13, chat): sales_order_items
-- only has product_id (finished-goods catalog SKU), but sd_quotation_items describes a
-- bespoke print job by physical spec (paper_type, dimensions, print_colors, lamination, ...)
-- with NO product_id at all — this print shop quotes custom jobs, not catalog SKUs. Because
-- of this mismatch, the 2 quotation-to-order conversion paths (approveQuotation() in
-- drizzle-quotation.repo.ts, convertQuotationToOrder() in sd-quotations.repository.ts) could
-- only ever insert the sales_orders HEADER row — they had no column to carry the quotation's
-- line-item spec into, so converted orders silently lost their entire product breakdown.
--
-- These columns mirror sd_quotation_items' physical-spec columns 1:1 (types matched live via
-- psql \d sd_quotation_items 2026-07-13) so a conversion can copy the spec across with
-- product_id left NULL (the order line is "custom, no catalog SKU"). Quotation-internal
-- PRICING breakdown columns (cost_price/paper_cost/production_cost/print_cost/delivery_cost/
-- die_cost) are deliberately NOT mirrored — the order line's existing net_price/total_price
-- already carry the final agreed price.
--
-- quotation_item_id is an additional soft-reference (no FK) back to sd_quotation_items.id, so
-- a re-run of the conversion can detect already-copied lines instead of duplicating them.
--
-- All nullable, additive — existing product_id-based order-item rows and the canonical manual
-- create-order flow (create-order.handler.ts's saveItems()) are completely unaffected (Q-46).
--
-- Human-readable mirror of the SCHEMA_MIGRATIONS entries in
-- apps/api/src/shared/db/invariants/migrations-schema.ts (actual boot-time loader).
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS quotation_item_id INTEGER;
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS product_type VARCHAR(100);
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS paper_type VARCHAR(100);
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS thickness_mm NUMERIC;
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS length_mm NUMERIC;
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS width_mm NUMERIC;
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS height_mm NUMERIC;
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS print_colors INTEGER;
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS lamination BOOLEAN;
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS perforation BOOLEAN;
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS special_coating BOOLEAN;
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS is_new_die BOOLEAN;
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS printing_method VARCHAR(100);
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS machine_format VARCHAR(100);
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS load_capacity_kg NUMERIC;
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS core_diameter_mm NUMERIC;
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS gilza_diameter_mm NUMERIC;
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS roll_length_m NUMERIC;
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS kashirovka BOOLEAN;
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS print_sides SMALLINT;
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS layer_count INTEGER;
ALTER TABLE IF EXISTS sales_order_items ADD COLUMN IF NOT EXISTS setup_time_minutes INTEGER;
