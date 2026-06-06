-- APPROVED: owner 2026-06-05 — add sales_order_items.product_id -> products(id) FK.
-- Order line-items bind to PRODUCTS (finished goods the customer orders). material_id is KEPT
-- (production/material-consumption side, vision #10). Nullable + idempotent. NO data change.
ALTER TABLE sales_order_items
  ADD COLUMN IF NOT EXISTS product_id integer REFERENCES products(id);
