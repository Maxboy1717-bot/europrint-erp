-- POS Schema Extensions v3 Migration
-- Matches Drizzle schema in lib/db/src/schema/pos-schema-extensions.ts
-- All table names use pos_ prefix, column names match schema definitions.

-- ─── ENUMS ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pos_confirm_step_enum') THEN
    CREATE TYPE pos_confirm_step_enum AS ENUM ('DRAFT','KARANTIN','QC','OMBOR','FINANCE','AI_GL');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pos_confirm_decision_enum') THEN
    CREATE TYPE pos_confirm_decision_enum AS ENUM ('APPROVED','REJECTED','REWORK');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pos_barcode_type_enum') THEN
    CREATE TYPE pos_barcode_type_enum AS ENUM ('EAN13','CODE128','QR');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pos_stock_alert_type_enum') THEN
    CREATE TYPE pos_stock_alert_type_enum AS ENUM ('LOW_STOCK','OUT_OF_STOCK','EXPIRY_NEAR','EXPIRED','NEGATIVE','OVERSTOCK');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pos_stock_alert_severity_enum') THEN
    CREATE TYPE pos_stock_alert_severity_enum AS ENUM ('INFO','WARNING','CRITICAL');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pos_gl_stage_name_enum') THEN
    CREATE TYPE pos_gl_stage_name_enum AS ENUM ('EXTRACT','CLASSIFY','COMPUTE','VERIFY','POST');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pos_gl_posting_status_enum') THEN
    CREATE TYPE pos_gl_posting_status_enum AS ENUM ('PROCESSING','AWAITING_REVIEW','APPROVED','REJECTED','POSTED');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pos_inventory_plan_status_enum') THEN
    CREATE TYPE pos_inventory_plan_status_enum AS ENUM ('SCHEDULED','IN_PROGRESS','COUNTING_DONE','FINANCE_REVIEW','APPROVED','REJECTED');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pos_variance_type_enum') THEN
    CREATE TYPE pos_variance_type_enum AS ENUM ('SHORTAGE','SURPLUS');
  END IF;
END$$;

-- ─── 1. POS_STOCK_LEDGER ────────────────────────────────────────────────────
-- Matches: stockLedger = pgTable('pos_stock_ledger', ...)

CREATE TABLE IF NOT EXISTS pos_stock_ledger (
  id               BIGSERIAL     PRIMARY KEY,
  ts               TIMESTAMP     NOT NULL DEFAULT NOW(),
  material_card_id INTEGER       NOT NULL,
  warehouse_id     VARCHAR(50)   NOT NULL,
  batch_id         INTEGER,
  movement_id      INTEGER,
  qty_change       NUMERIC(18,4) NOT NULL,
  balance_after    NUMERIC(18,4) NOT NULL,
  reason           VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_stock_ledger_mat_wh_ts ON pos_stock_ledger (material_card_id, warehouse_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_movement  ON pos_stock_ledger (movement_id);

-- ─── 2. POS_MOVEMENT_CONFIRMATIONS ──────────────────────────────────────────
-- Matches: movementConfirmations = pgTable('pos_movement_confirmations', ...)

CREATE TABLE IF NOT EXISTS pos_movement_confirmations (
  id             SERIAL        PRIMARY KEY,
  movement_id    INTEGER       NOT NULL,
  step           pos_confirm_step_enum     NOT NULL,
  user_id        INTEGER       NOT NULL,
  decision       pos_confirm_decision_enum NOT NULL,
  comment        TEXT,
  signed_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
  signature_hash VARCHAR(64)   NOT NULL,
  ip             INET
);

CREATE INDEX IF NOT EXISTS idx_mv_confirm_movement ON pos_movement_confirmations (movement_id);
CREATE INDEX IF NOT EXISTS idx_mv_confirm_user     ON pos_movement_confirmations (user_id);

-- ─── 3. POS_BARCODE_MAP ─────────────────────────────────────────────────────
-- Matches: barcodeMap = pgTable('pos_barcode_map', ...)

CREATE TABLE IF NOT EXISTS pos_barcode_map (
  id               SERIAL       PRIMARY KEY,
  barcode          VARCHAR(200) NOT NULL UNIQUE,
  barcode_type     pos_barcode_type_enum NOT NULL DEFAULT 'EAN13',
  material_card_id INTEGER      NOT NULL,
  batch_id         INTEGER,
  is_primary       BOOLEAN      NOT NULL DEFAULT FALSE,
  scan_count       INTEGER      NOT NULL DEFAULT 0,
  last_scanned_at  TIMESTAMP,
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barcode_map_mat     ON pos_barcode_map (material_card_id);
CREATE INDEX IF NOT EXISTS idx_barcode_map_barcode ON pos_barcode_map (barcode);

-- ─── 4. POS_MATERIAL_PASSPORTS ──────────────────────────────────────────────
-- Matches: materialPassports = pgTable('pos_material_passports', ...)

CREATE TABLE IF NOT EXISTS pos_material_passports (
  id                       SERIAL     PRIMARY KEY,
  material_card_id         INTEGER    NOT NULL,
  batch_id                 INTEGER,
  external_in_movement_id  INTEGER    NOT NULL,
  supplier_invoice_url     TEXT,
  quality_certificate_url  TEXT,
  tech_passport_url        TEXT,
  serial_no                VARCHAR(100),
  warranty_until           TIMESTAMP,
  photos                   JSONB      NOT NULL DEFAULT '[]'::jsonb,
  created_at               TIMESTAMP  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mat_passport_mat      ON pos_material_passports (material_card_id);
CREATE INDEX IF NOT EXISTS idx_mat_passport_movement ON pos_material_passports (external_in_movement_id);

-- ─── 5. POS_STOCK_ALERTS ────────────────────────────────────────────────────
-- Matches: stockAlerts = pgTable('pos_stock_alerts', ...)

CREATE TABLE IF NOT EXISTS pos_stock_alerts (
  id               SERIAL     PRIMARY KEY,
  material_card_id INTEGER    NOT NULL,
  warehouse_id     VARCHAR(50) NOT NULL,
  alert_type       pos_stock_alert_type_enum     NOT NULL,
  threshold_value  NUMERIC(18,4),
  current_value    NUMERIC(18,4)  NOT NULL,
  severity         pos_stock_alert_severity_enum NOT NULL DEFAULT 'WARNING',
  acknowledged     BOOLEAN    NOT NULL DEFAULT FALSE,
  acknowledged_by  INTEGER,
  acknowledged_at  TIMESTAMP,
  resolved         BOOLEAN    NOT NULL DEFAULT FALSE,
  resolved_at      TIMESTAMP,
  created_at       TIMESTAMP  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_alert_mat_wh  ON pos_stock_alerts (material_card_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_alert_type    ON pos_stock_alerts (alert_type);
CREATE INDEX IF NOT EXISTS idx_stock_alert_resolved ON pos_stock_alerts (resolved);

-- ─── 6. POS_GL_POSTING_LOG ──────────────────────────────────────────────────
-- Matches: glPostingLog = pgTable('pos_gl_posting_log', ...)

CREATE TABLE IF NOT EXISTS pos_gl_posting_log (
  id            SERIAL     PRIMARY KEY,
  movement_id   INTEGER    NOT NULL,
  stage         INTEGER    NOT NULL,
  stage_name    pos_gl_stage_name_enum    NOT NULL,
  ai_confidence NUMERIC(5,4),
  gl_entries    JSONB      NOT NULL DEFAULT '[]'::jsonb,
  status        pos_gl_posting_status_enum NOT NULL DEFAULT 'PROCESSING',
  error_message TEXT,
  processed_at  TIMESTAMP  NOT NULL DEFAULT NOW(),
  approved_by   INTEGER,
  approved_at   TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gl_log_movement ON pos_gl_posting_log (movement_id);
CREATE INDEX IF NOT EXISTS idx_gl_log_status   ON pos_gl_posting_log (status);

-- ─── 7. POS_INVENTORY_PLANS ─────────────────────────────────────────────────
-- Matches: inventoryPlans = pgTable('pos_inventory_plans', ...)

CREATE TABLE IF NOT EXISTS pos_inventory_plans (
  id                   SERIAL       PRIMARY KEY,
  plan_no              VARCHAR(50)  NOT NULL UNIQUE,
  warehouse_id         VARCHAR(50)  NOT NULL,
  scheduled_for        TIMESTAMP    NOT NULL,
  status               pos_inventory_plan_status_enum NOT NULL DEFAULT 'SCHEDULED',
  created_by           INTEGER      NOT NULL,
  responsible_user_id  INTEGER,
  started_at           TIMESTAMP,
  finished_at          TIMESTAMP,
  approved_by_finance  INTEGER,
  approved_at          TIMESTAMP,
  notes                TEXT,
  created_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_plan_wh     ON pos_inventory_plans (warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inv_plan_status ON pos_inventory_plans (status);

-- ─── 8. POS_INVENTORY_VARIANCES ─────────────────────────────────────────────
-- Matches: inventoryVariances = pgTable('pos_inventory_variances', ...)

CREATE TABLE IF NOT EXISTS pos_inventory_variances (
  id               SERIAL        PRIMARY KEY,
  plan_id          INTEGER       NOT NULL REFERENCES pos_inventory_plans(id),
  material_card_id INTEGER       NOT NULL,
  diff_qty         NUMERIC(18,4) NOT NULL,
  diff_amount      NUMERIC(18,4) NOT NULL DEFAULT 0,
  variance_type    pos_variance_type_enum NOT NULL,
  gl_posted        BOOLEAN       NOT NULL DEFAULT FALSE,
  gl_posted_at     TIMESTAMP,
  created_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_variance_plan ON pos_inventory_variances (plan_id);
CREATE INDEX IF NOT EXISTS idx_inv_variance_mat  ON pos_inventory_variances (material_card_id);

-- ─── 9. POS_NOTIFICATIONS ───────────────────────────────────────────────────
-- Matches: posNotifications = pgTable('pos_notifications', ...)

CREATE TABLE IF NOT EXISTS pos_notifications (
  id                SERIAL       PRIMARY KEY,
  user_id           INTEGER      NOT NULL,
  notification_type VARCHAR(50)  NOT NULL,
  title             VARCHAR(200) NOT NULL,
  body              TEXT         NOT NULL,
  entity_type       VARCHAR(50),
  entity_id         INTEGER,
  is_read           BOOLEAN      NOT NULL DEFAULT FALSE,
  read_at           TIMESTAMP,
  metadata          JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pos_notif_user ON pos_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_pos_notif_read ON pos_notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_pos_notif_type ON pos_notifications (notification_type);
