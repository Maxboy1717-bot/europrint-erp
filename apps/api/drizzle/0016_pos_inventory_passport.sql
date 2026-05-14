-- Inventar pasporti: EXTERNAL_IN harakatlar uchun
CREATE TABLE IF NOT EXISTS pos_inventory_passport (
  id                    SERIAL PRIMARY KEY,
  movement_id           INTEGER NOT NULL REFERENCES pos_movements(id) ON DELETE CASCADE,
  material_code         VARCHAR(100),
  supplier_name         VARCHAR(255),
  contract_number       VARCHAR(100),
  waybill_number        VARCHAR(100),
  arrival_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity              NUMERIC(14,3) NOT NULL DEFAULT 0,
  weight_kg             NUMERIC(10,3),
  volume_m3             NUMERIC(10,3),
  certificate_number    VARCHAR(100),
  quarantine_started_at TIMESTAMPTZ,
  qc_started_at         TIMESTAMPTZ,
  qc_result             VARCHAR(20) CHECK (qc_result IN ('QABUL','REWORK','CHIQARISH')),
  qc_note               TEXT,
  transferred_at        TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_inv_passport_movement ON pos_inventory_passport(movement_id);
CREATE INDEX IF NOT EXISTS idx_pos_inv_passport_supplier ON pos_inventory_passport(supplier_name);
CREATE INDEX IF NOT EXISTS idx_pos_inv_passport_arrival  ON pos_inventory_passport(arrival_date DESC);

-- Quarantine status qo'shimchalari (pos_movements.status uchun)
-- Mavjud status enum'ga 'karantin' qo'shish
DO $$ BEGIN
  ALTER TYPE pos_movement_status_enum ADD VALUE IF NOT EXISTS 'karantin';
EXCEPTION WHEN duplicate_object THEN null;
END $$;
