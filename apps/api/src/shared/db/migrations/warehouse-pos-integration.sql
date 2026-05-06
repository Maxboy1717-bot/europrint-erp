-- ============================================================================
-- Warehouse ↔ POS Monitor Integration
-- ============================================================================
-- Bu migration Warehouse Hub va POS Monitor o'rtasidagi real-time
-- integratsiya uchun yetishmayotgan ob'ektlarni yaratadi.
-- ============================================================================

-- ─── 1. pos_sync_events ─────────────────────────────────────────────────────
-- POS Monitor offline rejimda ishlasa, shu jadvaldan eventlarni o'qiydi.
CREATE TABLE IF NOT EXISTS pos_sync_events (
  id            BIGSERIAL PRIMARY KEY,
  warehouse_id  INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
  event_type    VARCHAR(64) NOT NULL,
  payload       JSONB,
  triggered_by  INTEGER,
  delivered     BOOLEAN NOT NULL DEFAULT false,
  delivered_at  TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_sync_events_undelivered
  ON pos_sync_events (warehouse_id, created_at)
  WHERE delivered = false;

CREATE INDEX IF NOT EXISTS idx_pos_sync_events_type
  ON pos_sync_events (event_type, created_at);

-- ─── 2. pos_warehouse_stock_view ────────────────────────────────────────────
-- Warehouse Hub va POS Monitor bitta source-of-truth ishlatadi.
-- material_cards + warehouse_stock + warehouses join.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name IN ('warehouse_stock', 'material_cards', 'warehouses')
             GROUP BY 1 HAVING COUNT(DISTINCT table_name) = 3) THEN
    DROP VIEW IF EXISTS pos_warehouse_stock_view;
    CREATE VIEW pos_warehouse_stock_view AS
    SELECT
      ws.id                                       AS stock_id,
      w.id                                        AS warehouse_id,
      w.code                                      AS warehouse_code,
      w.name                                      AS warehouse_name,
      COALESCE(w.type, 'general')                 AS warehouse_type,
      mc.id                                       AS material_card_id,
      mc.code                                     AS material_code,
      mc.name                                     AS material_name,
      COALESCE(mc.name_ru, mc.name)               AS material_name_ru,
      COALESCE(mc.category, 'general')            AS category,
      COALESCE(mc.material_type, 'general')       AS material_type,
      COALESCE(mc.unit_of_measure, 'EA')          AS unit_of_measure,
      COALESCE(ws.quantity, 0)::numeric           AS quantity,
      COALESCE(ws.reserved_quantity, 0)::numeric  AS reserved_quantity,
      (COALESCE(ws.quantity, 0) - COALESCE(ws.reserved_quantity, 0))::numeric AS available_quantity,
      COALESCE(mc.min_stock, 0)::numeric          AS min_stock,
      COALESCE(mc.max_stock, 0)::numeric          AS max_stock,
      COALESCE(mc.unit_price, 0)::numeric         AS unit_price,
      COALESCE(mc.currency, 'UZS')                AS currency,
      CASE
        WHEN COALESCE(ws.quantity, 0) <= 0 THEN 'OUT_OF_STOCK'
        WHEN COALESCE(ws.quantity, 0) <= COALESCE(mc.min_stock, 0) THEN 'LOW_STOCK'
        WHEN COALESCE(mc.max_stock, 0) > 0 AND COALESCE(ws.quantity, 0) >= COALESCE(mc.max_stock, 0) THEN 'OVER_STOCK'
        ELSE 'OK'
      END                                          AS stock_status
    FROM warehouse_stock ws
    INNER JOIN warehouses w ON w.id = ws.warehouse_id
    INNER JOIN material_cards mc ON mc.id = ws.material_card_id
    WHERE COALESCE(w.is_active, true) = true;
  END IF;
END $$;

-- ─── 3. fn_warehouse_stock_change_trigger ───────────────────────────────────
-- warehouse_stock o'zgarganda avtomatik POS Sync event yaratadi
CREATE OR REPLACE FUNCTION fn_warehouse_stock_change_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Faqat haqiqiy o'zgarishlar uchun event yaratamiz
  IF TG_OP = 'UPDATE' AND
     OLD.quantity IS NOT DISTINCT FROM NEW.quantity AND
     OLD.reserved_quantity IS NOT DISTINCT FROM NEW.reserved_quantity THEN
    RETURN NEW;
  END IF;

  INSERT INTO pos_sync_events (warehouse_id, event_type, payload, created_at)
  VALUES (
    NEW.warehouse_id,
    'STOCK_CHANGED',
    jsonb_build_object(
      'materialCardId', NEW.material_card_id,
      'oldQuantity',    COALESCE(OLD.quantity, 0),
      'newQuantity',    NEW.quantity,
      'op',             TG_OP
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'warehouse_stock') THEN
    DROP TRIGGER IF EXISTS trg_warehouse_stock_pos_sync ON warehouse_stock;
    CREATE TRIGGER trg_warehouse_stock_pos_sync
      AFTER INSERT OR UPDATE ON warehouse_stock
      FOR EACH ROW EXECUTE FUNCTION fn_warehouse_stock_change_trigger();
  END IF;
END $$;

-- ─── 4. Indexlar — performance ──────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warehouse_stock') THEN
    CREATE INDEX IF NOT EXISTS idx_warehouse_stock_wh_mat
      ON warehouse_stock (warehouse_id, material_card_id);
    CREATE INDEX IF NOT EXISTS idx_warehouse_stock_low
      ON warehouse_stock (warehouse_id)
      WHERE quantity <= 0 OR quantity < (SELECT COALESCE(min_stock, 0) FROM material_cards WHERE id = warehouse_stock.material_card_id);
  END IF;
END $$;

-- ============================================================================
-- Warehouse ↔ POS integration migration completed
-- ============================================================================
