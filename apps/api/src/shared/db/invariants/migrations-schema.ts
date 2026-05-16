/**
 * @module invariants/migrations-schema
 * @description Schema-addition migrations (tables, columns, indexes, seeds).
 */

export interface MigrationDef { name: string; sql: string }

export const SCHEMA_MIGRATIONS: Array<MigrationDef> = [
  {
    name: 'domain_events outbox table (PA0-6)',
    sql: `
      CREATE TABLE IF NOT EXISTS domain_events (
        id              UUID PRIMARY KEY,
        aggregate_type  TEXT NOT NULL,
        aggregate_id    TEXT NOT NULL,
        event_name      TEXT NOT NULL,
        payload         JSONB NOT NULL,
        occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        published_at    TIMESTAMPTZ,
        attempts        INTEGER NOT NULL DEFAULT 0,
        last_error      TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `,
  },
  {
    name: 'domain_events unpublished index',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_domain_events_unpublished
      ON domain_events (published_at, occurred_at)
    `,
  },
  {
    name: 'sd_sales_orders.version column',
    sql: `ALTER TABLE IF EXISTS sd_sales_orders ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0`,
  },
  {
    name: 'sd_advance_idempotency_keys table',
    sql: `
      CREATE TABLE IF NOT EXISTS sd_advance_idempotency_keys (
        id               SERIAL PRIMARY KEY,
        order_id         INTEGER NOT NULL,
        idempotency_key  TEXT    NOT NULL,
        advance_paid     NUMERIC(15,2) NOT NULL,
        created_at       TIMESTAMP DEFAULT NOW(),
        CONSTRAINT uq_sd_advance_idempotency UNIQUE (order_id, idempotency_key)
      )
    `,
  },
  {
    name: 'wms_alerts deduplicate open low_stock rows before unique index',
    sql: `
      DELETE FROM wms_alerts a
      USING (
        SELECT MIN(id) AS keep_id, material_id, warehouse_id
        FROM wms_alerts
        WHERE type = 'low_stock' AND is_resolved = false
        GROUP BY material_id, warehouse_id
        HAVING COUNT(*) > 1
      ) dup
      WHERE a.material_id = dup.material_id
        AND a.warehouse_id = dup.warehouse_id
        AND a.type = 'low_stock'
        AND a.is_resolved = false
        AND a.id <> dup.keep_id
    `,
  },
  {
    name: 'wms_alerts unique open low_stock index',
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS uq_wms_alert_open_low_stock
      ON wms_alerts (material_id, warehouse_id)
      WHERE type = 'low_stock' AND is_resolved = false
    `,
  },
  {
    name: 'sd_orders.version column',
    sql: `ALTER TABLE IF EXISTS sd_orders ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0`,
  },
  {
    name: 'cfo_config table',
    sql: `
      CREATE TABLE IF NOT EXISTS cfo_config (
        id           SERIAL PRIMARY KEY,
        config_key   VARCHAR(100) NOT NULL UNIQUE,
        config_value NUMERIC(20,6) NOT NULL,
        description  TEXT,
        updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `,
  },
  {
    name: 'cfo_config seed ECL rates and financial parameters',
    sql: `
      INSERT INTO cfo_config (config_key, config_value, description) VALUES
        ('ar_ecl_rate_0_30',   0.020000, 'AR ECL stavkasi: 0-30 kun'),
        ('ar_ecl_rate_31_60',  0.080000, 'AR ECL stavkasi: 31-60 kun'),
        ('ar_ecl_rate_61_90',  0.200000, 'AR ECL stavkasi: 61-90 kun'),
        ('ar_ecl_rate_91_plus',0.500000, 'AR ECL stavkasi: 91+ kun'),
        ('default_cost_ratio', 0.350000, 'Standart xarajat nisbati (35% of revenue)'),
        ('min_cash_reserve_uzs',50000000.000000, 'Minimal naqd pul rezervi (so''m)')
      ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value
    `,
  },
  {
    name: 'cfo_config rename ecl_rate keys to ar_ecl_rate',
    sql: `
      UPDATE cfo_config SET config_key = 'ar_ecl_rate_0_30'  WHERE config_key = 'ecl_rate_0_30';
      UPDATE cfo_config SET config_key = 'ar_ecl_rate_31_60' WHERE config_key = 'ecl_rate_31_60';
      UPDATE cfo_config SET config_key = 'ar_ecl_rate_61_90' WHERE config_key = 'ecl_rate_61_90';
      UPDATE cfo_config SET config_key = 'ar_ecl_rate_91_plus' WHERE config_key = 'ecl_rate_91_180';
      DELETE FROM cfo_config WHERE config_key IN ('ecl_rate_181_365','ecl_rate_365plus','ar_ecl_rate_181_365','ar_ecl_rate_365plus','ar_ecl_rate_91_180');
    `,
  },
  {
    name: 'cfo_config consolidate ar_ecl_rate_91_plus and fix default_cost_ratio',
    sql: `
      DELETE FROM cfo_config WHERE config_key IN ('ar_ecl_rate_181_365','ar_ecl_rate_365plus','ar_ecl_rate_91_180');
      INSERT INTO cfo_config (config_key, config_value, description)
        VALUES ('ar_ecl_rate_91_plus', 0.500000, 'AR ECL stavkasi: 91+ kun')
        ON CONFLICT (config_key) DO UPDATE SET config_value = 0.500000;
      UPDATE cfo_config SET config_value = 0.350000, description = 'Standart xarajat nisbati (35% of revenue)'
        WHERE config_key = 'default_cost_ratio';
    `,
  },
  {
    name: 'Sprint1 standard_cost table',
    sql: `
      CREATE TABLE IF NOT EXISTS standard_cost (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_name     VARCHAR(255) NOT NULL,
        period           VARCHAR(7)   NOT NULL,
        std_material_uzs NUMERIC(18,4) NOT NULL DEFAULT 0,
        std_labor_uzs    NUMERIC(18,4) NOT NULL DEFAULT 0,
        std_overhead_uzs NUMERIC(18,4) NOT NULL DEFAULT 0,
        created_at       TIMESTAMPTZ  DEFAULT now(),
        updated_at       TIMESTAMPTZ  DEFAULT now(),
        UNIQUE (product_name, period)
      );
      CREATE INDEX IF NOT EXISTS idx_standard_cost_product ON standard_cost(product_name);
      CREATE INDEX IF NOT EXISTS idx_standard_cost_period  ON standard_cost(period);
    `,
  },
  { name: 'Sprint1 standard_cost add product_id int col',
    sql: `ALTER TABLE standard_cost ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL` },
  { name: 'Sprint1 standard_cost add std_total_uzs col',
    sql: `ALTER TABLE standard_cost ADD COLUMN IF NOT EXISTS std_total_uzs NUMERIC(18,4) GENERATED ALWAYS AS (std_material_uzs + std_labor_uzs + std_overhead_uzs) STORED` },
  { name: 'Sprint1 standard_cost add created_by int col',
    sql: `ALTER TABLE standard_cost ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL` },
  { name: 'Sprint1 standard_cost product_id index',
    sql: `CREATE INDEX IF NOT EXISTS idx_standard_cost_product_id ON standard_cost(product_id)` },
  {
    name: 'Sprint1 price_tier table',
    sql: `
      CREATE TABLE IF NOT EXISTS price_tier (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_name VARCHAR(255) NOT NULL,
        tier_name    VARCHAR(50)  NOT NULL,
        min_qty      INTEGER      NOT NULL DEFAULT 0,
        max_qty      INTEGER,
        price_uzs    NUMERIC(18,4) NOT NULL,
        valid_from   DATE         NOT NULL,
        valid_to     DATE,
        created_at   TIMESTAMPTZ  DEFAULT now(),
        CONSTRAINT chk_price_tier_qty   CHECK (min_qty >= 0 AND (max_qty IS NULL OR max_qty > min_qty)),
        CONSTRAINT chk_price_tier_price CHECK (price_uzs > 0),
        UNIQUE (product_name, min_qty, valid_from)
      );
      CREATE INDEX IF NOT EXISTS idx_price_tier_product ON price_tier(product_name);
    `,
  },
  { name: 'Sprint1 price_tier add product_id int col',
    sql: `ALTER TABLE price_tier ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL` },
  { name: 'Sprint1 price_tier add created_by int col',
    sql: `ALTER TABLE price_tier ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL` },
  { name: 'Sprint1 price_tier product_id index',
    sql: `CREATE INDEX IF NOT EXISTS idx_price_tier_product_id ON price_tier(product_id)` },
  {
    name: 'Sprint1 variance_report table',
    sql: `
      CREATE TABLE IF NOT EXISTS variance_report (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id       UUID NOT NULL,
        mpv            NUMERIC(18,4) NOT NULL DEFAULT 0,
        mqv            NUMERIC(18,4) NOT NULL DEFAULT 0,
        lrv            NUMERIC(18,4) NOT NULL DEFAULT 0,
        lev            NUMERIC(18,4) NOT NULL DEFAULT 0,
        ov             NUMERIC(18,4) NOT NULL DEFAULT 0,
        total_variance NUMERIC(18,4) NOT NULL DEFAULT 0,
        calculated_at  TIMESTAMPTZ   DEFAULT now(),
        UNIQUE (order_id)
      );
      CREATE INDEX IF NOT EXISTS idx_variance_report_order ON variance_report(order_id);
    `,
  },
  { name: 'Sprint1 variance_report drop unique constraint',
    sql: `ALTER TABLE variance_report DROP CONSTRAINT IF EXISTS variance_report_order_id_key` },
  { name: 'Sprint1 variance_report drop old index',
    sql: `DROP INDEX IF EXISTS idx_variance_report_order` },
  { name: 'Sprint1 variance_report order_id to integer',
    sql: `ALTER TABLE variance_report ALTER COLUMN order_id TYPE INTEGER USING NULL` },
  { name: 'Sprint1 variance_report order_id drop notnull',
    sql: `ALTER TABLE variance_report ALTER COLUMN order_id DROP NOT NULL` },
  {
    name: 'Sprint1 variance_report order_id fk',
    sql: `
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'variance_report_order_id_fk'
        ) THEN
          ALTER TABLE variance_report ADD CONSTRAINT variance_report_order_id_fk
            FOREIGN KEY (order_id) REFERENCES production_orders(id) ON DELETE CASCADE;
        END IF;
      END $$
    `,
  },
  { name: 'Sprint1 variance_report unique index',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS uq_variance_report_order_id ON variance_report(order_id)` },
  {
    name: 'Sprint1 cost_structure table',
    sql: `
      CREATE TABLE IF NOT EXISTS cost_structure (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_name     VARCHAR(255) NOT NULL,
        period           VARCHAR(7)   NOT NULL,
        fixed_cost_uzs   NUMERIC(18,4) NOT NULL DEFAULT 0,
        variable_cost_uzs NUMERIC(18,4) NOT NULL DEFAULT 0,
        selling_price_uzs NUMERIC(18,4) NOT NULL DEFAULT 0,
        created_at       TIMESTAMPTZ  DEFAULT now(),
        updated_at       TIMESTAMPTZ  DEFAULT now(),
        UNIQUE (product_name, period)
      );
      CREATE INDEX IF NOT EXISTS idx_cost_structure_product ON cost_structure(product_name);
    `,
  },
  { name: 'Sprint1 cost_structure add product_id int col',
    sql: `ALTER TABLE cost_structure ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL` },
  { name: 'Sprint1 cost_structure add created_by int col',
    sql: `ALTER TABLE cost_structure ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL` },
  { name: 'Sprint1 cost_structure product_id index',
    sql: `CREATE INDEX IF NOT EXISTS idx_cost_structure_product_id ON cost_structure(product_id)` },
  {
    name: 'Sprint1 financial_ratios_snapshot table',
    sql: `
      CREATE TABLE IF NOT EXISTS financial_ratios_snapshot (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        period           VARCHAR(7)   NOT NULL UNIQUE,
        current_ratio    NUMERIC(12,6),
        quick_ratio      NUMERIC(12,6),
        gross_margin_pct NUMERIC(8,4),
        net_margin_pct   NUMERIC(8,4),
        roa              NUMERIC(8,4),
        roe              NUMERIC(8,4),
        debt_to_equity   NUMERIC(12,6),
        altman_z         NUMERIC(12,6),
        altman_zone      VARCHAR(20),
        revenue          NUMERIC(18,4),
        net_income       NUMERIC(18,4),
        created_at       TIMESTAMPTZ  DEFAULT now(),
        updated_at       TIMESTAMPTZ  DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_fin_ratios_snapshot_period ON financial_ratios_snapshot(period DESC);
    `,
  },
  {
    name: 'Sprint1 cfo_config defaults',
    sql: `
      INSERT INTO cfo_config (config_key, config_value, description) VALUES
        ('overhead_rate_per_hour',      15000, 'Umumiy xarajat stavkasi soatiga (UZS)'),
        ('std_labor_rate_per_hour',     25000, 'Standart mehnat stavkasi soatiga (UZS)'),
        ('shares_outstanding',      1000000,   'Muomaladagi aksiyalar soni'),
        ('share_price_uzs',             1000,  'Bir aksiya narxi (UZS)'),
        ('opening_cash_balance_uzs',       0,  'Boshlang\'ich kassa qoldig\'i (UZS)'),
        ('min_cash_reserve_uzs',    50000000,  'Minimal kassa zahirasi (UZS)')
      ON CONFLICT (config_key) DO NOTHING;
    `,
  },
];
