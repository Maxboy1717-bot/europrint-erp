-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/wms-material-kits-2026-06-20.sql
-- APPROVED: Claude (egasi vakolati) 2026-06-20
-- Fix: GET /api/iot-enhanced/material-kits (+ /material-kits/:id/items) → 503.
--   iot-enhanced.repository.ts raw-SQL reads mm_material_kits / mm_material_kit_items
--   which were never created. Schema derived from the exact SELECT/INSERT/UPDATE/JOIN
--   columns in that repo. FK targets (production_orders, employees, mm_materials)
--   live-verified as integer PKs. warehouse_id has NO FK: live wms_warehouses.id
--   has no PK/UNIQUE constraint (Postgres cannot reference it).
-- Idempotent (IF NOT EXISTS). Empty tables → endpoints return 200 {items:[],total:0}.
-- ============================================================

-- Parent: material kits
CREATE TABLE IF NOT EXISTS mm_material_kits (
  id                  SERIAL PRIMARY KEY,
  production_order_id INTEGER REFERENCES production_orders(id) ON DELETE SET NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'draft',
  prepared_by         INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  notes               TEXT,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mm_material_kits_production_order_id ON mm_material_kits(production_order_id);
CREATE INDEX IF NOT EXISTS idx_mm_material_kits_status             ON mm_material_kits(status);
CREATE INDEX IF NOT EXISTS idx_mm_material_kits_created_at         ON mm_material_kits(created_at);

-- Child: kit items (FK to parent, CASCADE on kit delete)
CREATE TABLE IF NOT EXISTS mm_material_kit_items (
  id           SERIAL PRIMARY KEY,
  kit_id       INTEGER NOT NULL REFERENCES mm_material_kits(id) ON DELETE CASCADE,
  material_id  INTEGER NOT NULL REFERENCES mm_materials(id) ON DELETE RESTRICT,
  quantity     NUMERIC NOT NULL DEFAULT 0,
  warehouse_id INTEGER,  -- intentionally NO FK: wms_warehouses.id has no PK/UNIQUE in live DB
  notes        TEXT
);
CREATE INDEX IF NOT EXISTS idx_mm_material_kit_items_kit_id      ON mm_material_kit_items(kit_id);
CREATE INDEX IF NOT EXISTS idx_mm_material_kit_items_material_id ON mm_material_kit_items(material_id);
