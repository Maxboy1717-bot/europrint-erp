-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- pp-gang-runs-acceptance-brak-2026-07-11.sql
-- Vision 07-pp#37 — Gang run ajratilganda har buyurtmaga alohida qabul akti; brak lot bo'yicha taqsim.
--   A gang run groups several production_orders printed on one physical sheet (print_job_ref).
--   On acceptance the whole run's brak is split proportionally by each member order's quantity
--   (vision default: proportional-by-quantity) and every member receives its own generated
--   acceptance-act reference (pp_gang_run_orders.acceptance_act_id). Mechanism-only — the split
--   weight is the order's own snapshotted quantity; no owner master-data (Q-40).
--
-- Additive + idempotent: CREATE TABLE / CREATE INDEX all IF NOT EXISTS. No existing table is
-- altered, no row is touched (Q-39/Q-46) — two brand-new tables only.
-- pp_gang_run_orders.production_order_id is a logical ref to production_orders.id (integer,
-- cross-module FK kept logical per ADR); gang_run_id has a real ON DELETE CASCADE FK to the
-- header so deleting a run removes its member rows.
--
-- DB-PROOF (rollback-tx, 2026-07-10): create (CTE header + unnest members, live orders 48/49/50
-- qty 5100/5000/4500) -> accept total brak 100 -> proportional split 34.9315/34.2466/30.8219
-- (sum = 100 exact, last member absorbs residual) -> each member got ACT-G{id}-O{oid}. PASS.
--
-- Qo'llash: psql postgresql://postgres:postgres@localhost:5432/europrint -f pp-gang-runs-acceptance-brak-2026-07-11.sql

BEGIN;

CREATE TABLE IF NOT EXISTS pp_gang_runs (
  id             SERIAL PRIMARY KEY,
  print_job_ref  VARCHAR(80)   NOT NULL,                  -- physical gang sheet / print job reference
  status         VARCHAR(20)   NOT NULL DEFAULT 'open',   -- 'open' | 'accepted'
  total_brak_qty NUMERIC(18,4) NOT NULL DEFAULT 0,        -- run-total brak split across members on accept
  notes          TEXT,
  created_by     INTEGER,                                 -- logical ref users.id (NULL = system)
  accepted_at    TIMESTAMPTZ,                             -- set when the run is accepted
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pp_gang_run_orders (
  id                  SERIAL PRIMARY KEY,
  gang_run_id         INTEGER       NOT NULL REFERENCES pp_gang_runs(id) ON DELETE CASCADE,
  production_order_id INTEGER       NOT NULL,             -- logical ref production_orders.id
  order_quantity      NUMERIC(18,4) NOT NULL DEFAULT 0,   -- snapshot of the order's qty = the split weight
  acceptance_act_id   VARCHAR(60),                        -- per-order acceptance act ref (generated on accept)
  brak_qty            NUMERIC(18,4) NOT NULL DEFAULT 0,   -- this order's share of total_brak_qty
  accepted_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pp_gang_run_orders_run_order
  ON pp_gang_run_orders (gang_run_id, production_order_id);
CREATE INDEX IF NOT EXISTS idx_pp_gang_run_orders_order
  ON pp_gang_run_orders (production_order_id);

COMMENT ON TABLE pp_gang_runs IS
  'Vision 07-pp#37: gang-run header - several production_orders printed on one physical sheet (print_job_ref).';
COMMENT ON TABLE pp_gang_run_orders IS
  'Vision 07-pp#37: gang-run member - per-order acceptance act + brak split proportional-by-quantity.';

COMMIT;

-- Tekshirish:
--   SELECT to_regclass('public.pp_gang_runs'), to_regclass('public.pp_gang_run_orders');  -- both non-null
--   SELECT gang_run_id, production_order_id, brak_qty, acceptance_act_id FROM pp_gang_run_orders ORDER BY id;
