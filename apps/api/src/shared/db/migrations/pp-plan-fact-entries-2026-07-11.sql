-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- pp-plan-fact-entries-2026-07-11.sql
-- Vision 07-pp#20 (EP-PP-106): "O'tgan yil fakti tavsiyasi" — AI shows last-year fact
-- statistics for a product (median as the primary recommendation + best-20% mean +
-- last-5 mean); the technologist chooses which statistic to use (E1: AI recommends,
-- human confirms).
--
-- The recommendation calculator needs an accumulating per-order plan-vs-actual store
-- keyed so it can be grouped by product and windowed by date. Verified absent
-- (node _audit/q.cjs "SELECT to_regclass('public.pp_plan_fact_entries')" -> null).
-- The existing production_facts / production_facts_sm72 tables are papka/shift
-- telemetry keyed by papka_no (varchar), NOT order/product-level plan-fact snapshots —
-- so this is a new grain, not a fork of a canonical table.
--
-- Additive & idempotent: CREATE TABLE / CREATE INDEX all IF NOT EXISTS. Both FK columns
-- are NULLABLE with ON DELETE SET NULL so a snapshot survives deletion of its source
-- order/product (historical stats must never vanish) and no existing row is touched.
-- production_orders.id / products.id are SERIAL (integer) so the INTEGER FKs are
-- type-correct.
--
-- Qo'llash: psql postgresql://postgres:postgres@localhost:5432/europrint -f pp-plan-fact-entries-2026-07-11.sql

CREATE TABLE IF NOT EXISTS pp_plan_fact_entries (
  id                  SERIAL PRIMARY KEY,
  production_order_id INTEGER REFERENCES production_orders(id) ON DELETE SET NULL,
  product_id          INTEGER REFERENCES products(id) ON DELETE SET NULL,
  entry_date          DATE        NOT NULL DEFAULT CURRENT_DATE,
  planned_qty         NUMERIC(18,4),
  actual_qty          NUMERIC(18,4),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- product_id + entry_date: the recommendation reads by product and windows "last year".
CREATE INDEX IF NOT EXISTS idx_pp_plan_fact_entries_product_date
  ON pp_plan_fact_entries (product_id, entry_date);
-- production_order_id: per-order lookups / joins back to the source order.
CREATE INDEX IF NOT EXISTS idx_pp_plan_fact_entries_order
  ON pp_plan_fact_entries (production_order_id);

-- DB-proof (verified via a scratchpad rollback tx on live europrint):
--   SELECT to_regclass('public.pp_plan_fact_entries');   -- non-null after apply
--   INSERT ... (product_id backfilled from production_orders via a COALESCE subselect)
--   median / top20 / last5 over a 7-row in-window sample -> 880 / 975 / 904; a product
--   with no rows -> sampleCount 0 -> null (honest "no recommendation yet").
