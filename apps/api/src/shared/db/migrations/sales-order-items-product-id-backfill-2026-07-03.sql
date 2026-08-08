-- APPROVED: owner 2026-06-05 (add-sales-order-items-product-id.sql) established that
-- sales_order_items.product_id -> products(id) is the canonical binding for order
-- line-items (finished goods); material_id is legacy/production-side only.
--
-- This backfill implements that already-approved decision for the one live order row
-- created by docs/migration/seed/seed-golden-thread-2026-06-20.sql (order GT-2026-001,
-- id 56), which pre-dates the fix to that seed script and still has product_id = NULL
-- with material_id = 33/34. That NULL is exactly the master-plan bug
-- (docs/audit/MASTER-REJA-VIZYON-2026-07-02.md §5.2 band 2.4 "ATP FE-wiring +
-- material/product nomoslik"): DrizzleSdAtpRepository.findOrderDemandLines() filters
-- `WHERE product_id IS NOT NULL`, so this order's lines were invisible to ATP
-- ("no lines"). No new table/column — pure data backfill, idempotent (WHERE ... IS NULL).
--
-- Mapping source: same seed script resolves material_id 33 -> products.code
-- 'GT-KARTON-BOX-A4' (id 49) and material_id 34 -> products.code 'GT-GOFROB-BOX-B3'
-- (id 50) — the same FG rows the seed's own production_orders.product_id already uses.

UPDATE sales_order_items soi
SET product_id = p.id
FROM products p
WHERE soi.sales_order_id = (SELECT id FROM sales_orders WHERE order_number = 'GT-2026-001' LIMIT 1)
  AND soi.product_id IS NULL
  AND soi.material_id = 33
  AND p.code = 'GT-KARTON-BOX-A4';

UPDATE sales_order_items soi
SET product_id = p.id
FROM products p
WHERE soi.sales_order_id = (SELECT id FROM sales_orders WHERE order_number = 'GT-2026-001' LIMIT 1)
  AND soi.product_id IS NULL
  AND soi.material_id = 34
  AND p.code = 'GT-GOFROB-BOX-B3';
