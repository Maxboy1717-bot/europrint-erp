-- ============================================================================
-- Migration: pos-monitor-fix-all.sql
--
-- POS Monitor frontend uchun barcha 500 xatolarni tuzatish:
--   1. warehouses jadvaliga yetishmayotgan ustunlar
--   2. pos_movements VIEW (pos_transactions'dan)
--   3. current_stock VIEW (warehouse_stock'dan)
--   4. pos_material_requests jadvali
--   5. employee_liability_cases jadvali
--   6. pos_movement_lines table (alias)
-- ============================================================================

-- ─── 1. warehouses ustunlar qo'shish ────────────────────────────────────────
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS is_free_storage boolean DEFAULT false;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS free_storage_days integer DEFAULT 30;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS monthly_rate numeric(12,2) DEFAULT 0;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS deleted_by integer;

-- address ni location'dan to'ldirish
UPDATE warehouses SET address = location WHERE address IS NULL AND location IS NOT NULL;

-- ─── 2. pos_movements VIEW (pos_transactions'dan) ───────────────────────────
DROP VIEW IF EXISTS pos_movements CASCADE;

-- pos_transactions schema tekshiramiz
DO $$
BEGIN
  -- Avval real jadval pos_transactions ustunlarini tekshirib, view yaratamiz
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'pos_transactions') THEN
    -- Empty placeholder view (real movement tarixi keyin material_movements'dan keladi)
    EXECUTE 'CREATE OR REPLACE VIEW pos_movements AS
      SELECT
        mm.id,
        mm.movement_type AS type,
        ''completed''::varchar AS status,
        mm.material_id AS material_card_id,
        mm.quantity,
        mm.unit,
        mm.performed_by,
        mm.created_at,
        mm.notes,
        NULL::integer AS warehouse_from_id,
        NULL::integer AS warehouse_to_id,
        NULL::varchar AS qc_status,
        ''POS-''||mm.id::text AS reference_number
      FROM material_movements mm';
  END IF;
END $$;

-- ─── 3. current_stock VIEW (warehouse_stock'dan) ────────────────────────────
DROP VIEW IF EXISTS current_stock CASCADE;
CREATE OR REPLACE VIEW current_stock AS
SELECT
  ws.id,
  ws.warehouse_id,
  ws.material_card_id,
  ws.quantity AS quantity_on_hand,
  ws.reserved_quantity AS quantity_reserved,
  ws.available_quantity AS quantity_available,
  ws.unit_of_measure,
  ws.last_updated_at,
  ws.created_at
FROM warehouse_stock ws;

-- ─── 4. pos_material_requests jadvali ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_material_requests (
  id              SERIAL PRIMARY KEY,
  requested_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  material_card_id INTEGER REFERENCES material_cards(id) ON DELETE CASCADE,
  warehouse_id    INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
  quantity        NUMERIC(12,4) NOT NULL,
  unit            VARCHAR(20),
  status          VARCHAR(30) DEFAULT 'pending',
  reason          TEXT,
  approved_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at     TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_requests_status ON pos_material_requests(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_pos_requests_user ON pos_material_requests(requested_by);

-- ─── 5. employee_liability_cases jadvali ────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_liability_cases (
  id              SERIAL PRIMARY KEY,
  employee_id     INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  case_type       VARCHAR(50),  -- 'damage', 'loss', 'shortage', 'theft'
  status          VARCHAR(30) DEFAULT 'OPEN',  -- OPEN, UNDER_REVIEW, RESOLVED, CLOSED
  description     TEXT,
  damage_amount   NUMERIC(12,2) DEFAULT 0,
  material_card_id INTEGER REFERENCES material_cards(id) ON DELETE SET NULL,
  warehouse_id    INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
  reported_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  resolved_at     TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_liability_status ON employee_liability_cases(status) WHERE status IN ('OPEN', 'UNDER_REVIEW');
CREATE INDEX IF NOT EXISTS idx_liability_employee ON employee_liability_cases(employee_id);

-- ─── 6. pos_movement_lines VIEW (qidiriladi pos_stock_ledger bilan birga) ──
DROP VIEW IF EXISTS pos_movement_lines CASCADE;
CREATE OR REPLACE VIEW pos_movement_lines AS
SELECT
  mm.id AS movement_id,
  mm.id AS line_id,
  mm.material_id AS material_card_id,
  mm.quantity,
  mm.unit,
  NULL::date AS expiry_date,
  NULL::varchar AS batch_number,
  mm.created_at
FROM material_movements mm;

-- ─── 7. Verify ──────────────────────────────────────────────────────────────
SELECT 'warehouses cols' AS check, COUNT(*) AS cols FROM information_schema.columns WHERE table_name='warehouses'
UNION ALL SELECT 'pos_movements view', (SELECT 1 FROM pg_views WHERE viewname='pos_movements')
UNION ALL SELECT 'current_stock view', (SELECT 1 FROM pg_views WHERE viewname='current_stock')
UNION ALL SELECT 'pos_movement_lines view', (SELECT 1 FROM pg_views WHERE viewname='pos_movement_lines')
UNION ALL SELECT 'pos_material_requests', (SELECT COUNT(*)::int FROM pos_material_requests)
UNION ALL SELECT 'employee_liability_cases', (SELECT COUNT(*)::int FROM employee_liability_cases);
