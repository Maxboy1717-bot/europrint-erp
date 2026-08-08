-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- pp-production-order-lines-2026-07-11.sql
-- EP-PP-118 / vision 07-pp#124 — Multi-line order (each position its own route).
--
-- WHAT: production_order_lines is an additive CHILD of production_orders. Each row is one
--   order position carrying its OWN product / route / quantity / status / seq — replacing the
--   1-order = 1-product assumption baked into the scalar production_orders.product_id. The
--   scalar column is RETAINED (Q-46, nothing that reads it regresses); every existing order is
--   back-filled to a single line (seq = 1) so the multi-line model is populated on day one and
--   no downstream reader ever sees an order with zero lines.
--
-- Q-35: one NEW table (production_order_lines) — owner-approved above (2026-07-11).
--
-- FK notes / live-data reality (verified read-only via _audit/q.cjs on europrint):
--   * production_order_id -> production_orders(id) ON DELETE CASCADE — hard FK; deleting an
--     order removes its lines.
--   * route_id -> technology_cards(id) ON DELETE SET NULL — technology_cards is the KANONIK
--     route / tech-card master (STANDARTLAR §15, ADR-006). Nullable: a line without an
--     assigned route defaults NULL (the order-level routing still applies) — non-regressive.
--   * product_id is a PLAIN NOT NULL integer with NO FK — deliberately mirroring the scalar
--     production_orders.product_id, which live carries NO enforced FK and dangling ids
--     (6 of 7 orders point at product_id=1, which does not exist — products master-data is
--     still being seeded, build phase). Enforcing a product FK here would fail the back-fill
--     on that pre-existing debt (Q-46: never block/regress on legacy data). A product FK can
--     be added in a later migration once products is populated.
--
-- Idempotent: CREATE TABLE / CREATE INDEX all IF NOT EXISTS; the back-fill is guarded by
--   NOT EXISTS so re-running never double-inserts a line for an already-migrated order.
--
-- Qo'llash: psql postgresql://postgres:postgres@localhost:5432/europrint -f pp-production-order-lines-2026-07-11.sql

CREATE TABLE IF NOT EXISTS production_order_lines (
  id                   SERIAL PRIMARY KEY,
  production_order_id  INTEGER       NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  product_id           INTEGER       NOT NULL,
  quantity             NUMERIC(18,4) NOT NULL DEFAULT 0,
  route_id             INTEGER       REFERENCES technology_cards(id)           ON DELETE SET NULL,
  seq                  INTEGER       NOT NULL DEFAULT 1,
  status               VARCHAR(20)   NOT NULL DEFAULT 'created',
  notes                TEXT,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_order_lines_order   ON production_order_lines (production_order_id);
CREATE INDEX IF NOT EXISTS idx_production_order_lines_product ON production_order_lines (product_id);
CREATE INDEX IF NOT EXISTS idx_production_order_lines_route   ON production_order_lines (route_id);
-- Each position within one order occupies a distinct seq (1,2,3…).
CREATE UNIQUE INDEX IF NOT EXISTS uq_production_order_lines_order_seq
  ON production_order_lines (production_order_id, seq);

-- Back-fill: every existing order -> one line (seq = 1) mirroring its scalar
-- product_id / planned_quantity / status. NOT EXISTS makes it idempotent.
INSERT INTO production_order_lines (production_order_id, product_id, quantity, seq, status)
SELECT po.id, po.product_id, po.planned_quantity, 1, po.status
FROM production_orders po
WHERE NOT EXISTS (
  SELECT 1 FROM production_order_lines pol WHERE pol.production_order_id = po.id
);

-- DB-proof (rollback-tx, live europrint) confirmed: table created, 7 orders -> 7 lines
-- (parity), create/list/update/delete line path works, FK + unique guards reject bad writes.
-- SELECT to_regclass('public.production_order_lines');   -- expected: non-null
-- SELECT count(*) FROM production_order_lines;           -- expected: = #production_orders
