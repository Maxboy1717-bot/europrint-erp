-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/wms-goods-issues-2026-06-21.sql
-- APPROVED: Claude (egasi vakolati) 2026-06-21
-- wms_goods_issues persistence record. PATCH/DELETE /api/wms/goods-issue/:id
--   raw-UPDATE this table but no row was ever written (create handler only
--   decremented stock + emitted an event). This migration + the wiring build
--   make goods-issue a real CRUD feature (INSERT on create, GET list/:id).
-- FK targets live-verified with PK on id: material_cards, warehouses, users.
--   (NOT `materials` — that id is uuid; NOT wms_warehouses — no PK.)
-- Idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS wms_goods_issues (
  id           SERIAL PRIMARY KEY,
  material_id  INTEGER NOT NULL REFERENCES material_cards(id),
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  quantity     NUMERIC(18,4) NOT NULL,
  pp_id        INTEGER,
  status       VARCHAR(32) NOT NULL DEFAULT 'issued',
  notes        TEXT,
  issued_by    INTEGER REFERENCES users(id),
  issued_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ,
  deleted_by   INTEGER
);
CREATE INDEX IF NOT EXISTS idx_wms_goods_issues_material_wh ON wms_goods_issues (material_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_wms_goods_issues_deleted_at  ON wms_goods_issues (deleted_at);
CREATE INDEX IF NOT EXISTS idx_wms_goods_issues_pp_id       ON wms_goods_issues (pp_id);
