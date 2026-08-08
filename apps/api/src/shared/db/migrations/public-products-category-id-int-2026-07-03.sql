-- APPROVED: Master-reja §5.3 band 3.10 (web-katalog/CMS) — fixing a live bug found
-- while verifying the acceptance criterion "admin mahsulot qo'sha oladi, public-endpoint
-- uni qaytaradi" (Q-29 verify-don't-trust, rollback-tx DB-proof, 2026-07-03).
--
-- Bug: public_products.category_id was authored as varchar while the table it
-- references (product_categories.id) is `serial` (integer) — the ONLY category_id
-- column in the schema with this mismatch (portfolio_items.category_id, which
-- references the same product_categories, is correctly integer). No FK constraint
-- was ever applied in the live DB for this column, so the type never surfaced until
-- a JOIN was attempted: every admin/public product-list/product-detail query
-- (ecommerce-catalog.helper.ts: ecommerceListProducts / ecommerceGetProduct /
-- ecommerceGetPublicProductBySlug / ecommerceCheckCategoryEmpty) crashes live with
-- "оператор не существует: integer = character varying" the moment a category_id
-- LEFT JOIN executes (reproduced live via rollback-tx SQL against europrint@5432).
--
-- Additive/corrective ALTER only — 0 rows in public_products have category_id set
-- (verified: SELECT count(*) FROM public_products WHERE category_id IS NOT NULL = 0),
-- so this is a zero-data-loss type correction, not a destructive change.
ALTER TABLE public_products
  ALTER COLUMN category_id TYPE integer USING category_id::integer;

-- Second live bug found by the same rollback-tx proof, surfaced only after the
-- type fix above (Postgres reports one planner error at a time): the Drizzle
-- schema (lib/db/src/schema/ecommerce-schema.ts) declares updated_at/deleted_at
-- as "convergence: live-DB superset columns" but they were never actually
-- applied to public_products — every SELECT that reads the full row
-- (ecommerceGetPublicProductBySlug / ecommerceListProducts / ecommerceGetProduct)
-- was crashing with 42703 "column does not exist". Additive, idempotent.
ALTER TABLE public_products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
ALTER TABLE public_products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
