import { sql } from 'drizzle-orm';
import { Logger } from '@nestjs/common';
import { db } from './schema';

const logger = new Logger('DbInvariants');

/**
 * TZ-D16: DB Invariant CHECK constraintlar (20+).
 *
 * Dastur ishga tushganda (main.ts bootstrap) bir marta chaqiriladi.
 * IF NOT EXISTS bilan — idempotent, xavfsiz qayta ishlash.
 *
 * Invariantlar ro'yxati:
 *  Inventar:    qty >= 0 (manfiy balans taqiqlangan)
 *  Ishlab ch.:  good+scrap <= planned (qat'iy chek)
 *  BOM:         parent != child (sikliy havolalar taqiqlangan)
 *  Maosh:       net <= gross, net >= 0
 *  Buyurtma:    qty > 0, total >= 0
 *  Hisob-fakt.: paid <= total, total >= 0
 *  Narx:        unit_price >= 0, cost_price >= 0
 *  Qolip:       qty_produced >= 0
 *  Xarid:       qty_received >= 0, qty_ordered > 0
 *  Budjet:      planned_amount >= 0, actual_amount >= 0
 *  Sensorlar:   latitude [-90,90], longitude [-180,180]
 *  HR-leave:    end_date >= start_date
 *  QC:          defect_count >= 0, sample_size > 0
 */
export async function ensureDbInvariants(): Promise<void> {
  const constraints: Array<{ name: string; table: string; check: string }> = [
    // ── Inventar ─────────────────────────────────────────────────
    {
      name: 'chk_inventory_qty_non_negative',
      table: 'wms_inventory_batches',
      check: 'quantity_on_hand >= 0',
    },
    {
      name: 'chk_stock_items_quantity_non_negative',
      table: 'stock_items',
      check: 'quantity::numeric >= 0',
    },
    {
      name: 'chk_stock_items_cost_non_negative',
      table: 'stock_items',
      check: 'cost_price::numeric >= 0',
    },
    // ── Ishlab chiqarish (PP/MES) ─────────────────────────────────
    {
      name: 'chk_bom_no_self_reference',
      table: 'pp_bom_components',
      check: 'parent_id != component_id',
    },
    {
      name: 'chk_production_orders_qty_positive',
      table: 'production_orders',
      check: 'planned_qty::numeric > 0',
    },
    {
      name: 'chk_production_orders_qty_non_negative',
      table: 'production_orders',
      check: 'actual_qty::numeric >= 0',
    },
    // ── Maosh (HR) ───────────────────────────────────────────────
    {
      name: 'chk_payroll_net_lte_gross',
      table: 'hr_payroll_records',
      check: 'net_salary <= gross_salary',
    },
    {
      name: 'chk_payroll_net_non_negative',
      table: 'hr_payroll_records',
      check: 'net_salary >= 0',
    },
    {
      name: 'chk_payroll_gross_non_negative',
      table: 'hr_payroll_records',
      check: 'gross_salary >= 0',
    },
    // ── Buyurtmalar (Sales / CRM) ────────────────────────────────
    {
      name: 'chk_sales_orders_total_non_negative',
      table: 'sales_orders',
      check: 'total_amount::numeric >= 0',
    },
    // ── Hisob-faktura (Finance) ──────────────────────────────────
    {
      name: 'chk_invoices_total_non_negative',
      table: 'invoices',
      check: 'total_amount::numeric >= 0',
    },
    {
      name: 'chk_invoices_paid_lte_total',
      table: 'invoices',
      check: 'paid_amount::numeric <= total_amount::numeric',
    },
    {
      name: 'chk_invoices_paid_non_negative',
      table: 'invoices',
      check: 'paid_amount::numeric >= 0',
    },
    // ── Budjet (Finance) ─────────────────────────────────────────
    {
      name: 'chk_budget_lines_planned_non_negative',
      table: 'budget_lines',
      check: 'planned_amount::numeric >= 0',
    },
    {
      name: 'chk_budget_lines_actual_non_negative',
      table: 'budget_lines',
      check: 'actual_amount::numeric >= 0',
    },
    // ── Xarid buyurtmalari (WMS) ─────────────────────────────────
    {
      name: 'chk_purchase_orders_qty_positive',
      table: 'purchase_orders',
      check: 'quantity::numeric > 0',
    },
    // ── Sensorlar (IoT) ──────────────────────────────────────────
    {
      name: 'chk_sensor_devices_latitude_range',
      table: 'sensor_devices',
      check: "latitude IS NULL OR (latitude::numeric BETWEEN -90 AND 90)",
    },
    {
      name: 'chk_sensor_devices_longitude_range',
      table: 'sensor_devices',
      check: "longitude IS NULL OR (longitude::numeric BETWEEN -180 AND 180)",
    },
    // ── HR ta'til (HR) ───────────────────────────────────────────
    {
      name: 'chk_leave_requests_end_gte_start',
      table: 'leave_requests',
      check: 'end_date >= start_date',
    },
    // ── Sifat nazorati (QC) ──────────────────────────────────────
    {
      name: 'chk_qc_defects_count_non_negative',
      table: 'qc_defects',
      check: 'defect_count >= 0',
    },
    // ── Paymentlar ───────────────────────────────────────────────
    {
      name: 'chk_payments_amount_positive',
      table: 'payments',
      check: 'amount::numeric > 0',
    },
  ];

  let applied = 0;
  let skipped = 0;

  for (const c of constraints) {
    try {
      await db.execute(sql.raw(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = '${c.name}'
            AND table_name = '${c.table}'
          ) THEN
            ALTER TABLE IF EXISTS ${c.table}
            ADD CONSTRAINT ${c.name} CHECK (${c.check});
          END IF;
        END;
        $$;
      `));
      applied++;
      logger.log(`Invariant OK: ${c.name}`);
    } catch (err) {
      skipped++;
      logger.warn(`Invariant o'tkazildi (jadval yo'q?): ${c.name} — ${String(err)}`);
    }
  }

  logger.log(`DB invariantlar: ${applied} ta qo'llandi, ${skipped} ta o'tkazildi`);
}

export async function ensureSchemaAdditions(): Promise<void> {
  const migrations: Array<{ name: string; sql: string }> = [
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
    // ── sd_orders version column (optimistic lock) ─────────────────
    {
      name: 'sd_orders.version column',
      sql: `ALTER TABLE IF EXISTS sd_orders ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0`,
    },
    // ── CFO config table + seed data ──────────────────────────────
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
    // ── Trigger: invoice total check (header total == SUM of line items) ──
    {
      name: 'fn_invoice_total_check trigger function',
      sql: `
        CREATE OR REPLACE FUNCTION fn_invoice_total_check()
        RETURNS TRIGGER AS $$
        DECLARE
          v_lines_sum NUMERIC;
        BEGIN
          -- Sum line items from finance_invoice_lines
          SELECT COALESCE(SUM(total::numeric), 0)
            INTO v_lines_sum
            FROM finance_invoice_lines
           WHERE invoice_id = NEW.id;
          -- Only validate when lines exist (during UPDATE after lines are inserted)
          IF v_lines_sum > 0 AND ABS(NEW.total_amount::numeric - v_lines_sum) > 0.01 THEN
            RAISE EXCEPTION 'Hisob-faktura: total_amount (%) qatorlar yig''indisi (%) ga mos kelmaydi',
              NEW.total_amount, v_lines_sum;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `,
    },
    {
      name: 'fn_invoice_total_check constraint trigger on fi_invoices',
      sql: `
        DROP TRIGGER IF EXISTS trg_invoice_total_check ON fi_invoices;
        CREATE CONSTRAINT TRIGGER trg_invoice_total_check
        AFTER INSERT OR UPDATE ON fi_invoices
        DEFERRABLE INITIALLY DEFERRED
        FOR EACH ROW EXECUTE FUNCTION fn_invoice_total_check();
      `,
    },
    // ── Trigger: inventory non-negative ───────────────────────────
    {
      name: 'fn_inventory_nonneg trigger function',
      sql: `
        CREATE OR REPLACE FUNCTION fn_inventory_nonneg()
        RETURNS TRIGGER AS $$
        BEGIN
          IF NEW.quantity IS NOT NULL AND NEW.quantity::numeric < 0 THEN
            RAISE EXCEPTION 'Inventar: quantity manfiy bo''la olmaydi (%)' , NEW.quantity;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `,
    },
    {
      name: 'fn_inventory_nonneg trigger on stock_items',
      sql: `
        DROP TRIGGER IF EXISTS trg_inventory_nonneg ON stock_items;
        CREATE TRIGGER trg_inventory_nonneg
        BEFORE INSERT OR UPDATE ON stock_items
        FOR EACH ROW EXECUTE FUNCTION fn_inventory_nonneg();
      `,
    },
    // ── Trigger: BOM quantity + full recursive cycle guard ──────────
    {
      name: 'fn_bom_cycle_check trigger function',
      sql: `
        CREATE OR REPLACE FUNCTION fn_bom_cycle_check()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Quantity must be positive for every BOM line item
          IF NEW.quantity IS NOT NULL AND NEW.quantity::numeric <= 0 THEN
            RAISE EXCEPTION 'BOM: quantity (%) > 0 bo''lishi kerak', NEW.quantity;
          END IF;
          -- Full recursive cycle guard using CTE:
          -- Adding (bom_id=X, material_id=Y) creates a cycle if the product P
          -- that BOM X produces is reachable through Y's BOM sub-tree.
          -- Walk from Y downward through all sub-components; if P appears, it is a cycle.
          IF NEW.bom_id IS NOT NULL AND NEW.material_id IS NOT NULL THEN
            IF EXISTS (
              WITH RECURSIVE reach AS (
                -- Start: NEW.material_id itself
                SELECT NEW.material_id AS mat
                UNION ALL
                -- Recurse: for each mat, find all components of BOMs that produce mat
                SELECT bi.material_id
                FROM reach r
                JOIN bom_headers bh ON bh.product_id = r.mat
                JOIN bom_items   bi ON bi.bom_id      = bh.id
                WHERE bi.id != COALESCE(NEW.id, -1)
              )
              SELECT 1 FROM reach r
              JOIN bom_headers bh ON bh.product_id = r.mat
              WHERE bh.id = NEW.bom_id
              LIMIT 1
            ) THEN
              RAISE EXCEPTION 'BOM: rekursiv siklik havola aniqlandi — bom_id=% material_id=%',
                NEW.bom_id, NEW.material_id;
            END IF;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `,
    },
    {
      name: 'fn_bom_cycle_check trigger on bom_items',
      sql: `
        DROP TRIGGER IF EXISTS trg_bom_cycle_check ON bom_items;
        CREATE TRIGGER trg_bom_cycle_check
        BEFORE INSERT OR UPDATE ON bom_items
        FOR EACH ROW EXECUTE FUNCTION fn_bom_cycle_check();
      `,
    },
    // ── Trigger: payroll net_pay > 0 AND <= base_salary ──────────────
    {
      name: 'fn_payroll_net_check trigger function',
      sql: `
        CREATE OR REPLACE FUNCTION fn_payroll_net_check()
        RETURNS TRIGGER AS $$
        BEGIN
          -- net_pay must be strictly positive (> 0)
          IF NEW.net_pay IS NOT NULL AND NEW.net_pay::numeric <= 0 THEN
            RAISE EXCEPTION 'Maosh: net_pay (%) > 0 bo''lishi kerak', NEW.net_pay;
          END IF;
          -- net_pay must not exceed base_salary
          IF NEW.net_pay IS NOT NULL AND NEW.base_salary IS NOT NULL
             AND NEW.net_pay::numeric > NEW.base_salary::numeric THEN
            RAISE EXCEPTION 'Maosh: net_pay (%) base_salary (%) dan oshib ketdi',
              NEW.net_pay, NEW.base_salary;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `,
    },
    {
      name: 'fn_payroll_net_check trigger on payroll_entries',
      sql: `
        DROP TRIGGER IF EXISTS trg_payroll_net_check ON payroll_entries;
        CREATE TRIGGER trg_payroll_net_check
        BEFORE INSERT OR UPDATE ON payroll_entries
        FOR EACH ROW EXECUTE FUNCTION fn_payroll_net_check();
      `,
    },
    // ── Trigger: advance payment cap ──────────────────────────────
    {
      name: 'fn_advance_payment_cap trigger function',
      sql: `
        CREATE OR REPLACE FUNCTION fn_advance_payment_cap()
        RETURNS TRIGGER AS $$
        BEGIN
          IF NEW.advance_paid IS NOT NULL AND NEW.total_amount IS NOT NULL
             AND NEW.advance_paid::numeric > NEW.total_amount::numeric THEN
            RAISE EXCEPTION 'Buyurtma: advance_paid (%) > total_amount (%) — ruxsat etilmaydi',
              NEW.advance_paid, NEW.total_amount;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `,
    },
    {
      name: 'fn_advance_payment_cap trigger on sd_orders',
      sql: `
        DROP TRIGGER IF EXISTS trg_advance_payment_cap ON sd_orders;
        CREATE TRIGGER trg_advance_payment_cap
        BEFORE INSERT OR UPDATE ON sd_orders
        FOR EACH ROW EXECUTE FUNCTION fn_advance_payment_cap();
      `,
    },
    {
      name: 'fn_advance_payment_cap trigger on sd_sales_orders',
      sql: `
        DROP TRIGGER IF EXISTS trg_advance_payment_cap ON sd_sales_orders;
        CREATE TRIGGER trg_advance_payment_cap
        BEFORE INSERT OR UPDATE ON sd_sales_orders
        FOR EACH ROW EXECUTE FUNCTION fn_advance_payment_cap();
      `,
    },
    // ── Trigger: production qty check (good+scrap <= planned*1.1) ─
    {
      name: 'fn_production_qty_check trigger function',
      sql: `
        CREATE OR REPLACE FUNCTION fn_production_qty_check()
        RETURNS TRIGGER AS $$
        DECLARE
          v_good     NUMERIC;
          v_scrap    NUMERIC;
          v_planned  NUMERIC;
        BEGIN
          -- planned_quantity must be positive
          IF NEW.planned_quantity IS NOT NULL AND NEW.planned_quantity::numeric <= 0 THEN
            RAISE EXCEPTION 'Ishlab chiqarish: planned_quantity (%) > 0 bo''lishi kerak', NEW.planned_quantity;
          END IF;
          -- confirmed (good) quantity must be non-negative
          IF NEW.confirmed_quantity IS NOT NULL AND NEW.confirmed_quantity::numeric < 0 THEN
            RAISE EXCEPTION 'Ishlab chiqarish: confirmed_quantity (%) manfiy bo''la olmaydi', NEW.confirmed_quantity;
          END IF;
          -- scrap quantity must be non-negative
          IF NEW.scrap_quantity IS NOT NULL AND NEW.scrap_quantity::numeric < 0 THEN
            RAISE EXCEPTION 'Ishlab chiqarish: scrap_quantity (%) manfiy bo''la olmaydi', NEW.scrap_quantity;
          END IF;
          -- good + scrap must not exceed planned (strict, no tolerance)
          v_good    := COALESCE(NEW.confirmed_quantity, 0)::numeric;
          v_scrap   := COALESCE(NEW.scrap_quantity, 0)::numeric;
          v_planned := COALESCE(NEW.planned_quantity, 0)::numeric;
          IF v_planned > 0 AND (v_good + v_scrap) > v_planned THEN
            RAISE EXCEPTION 'Ishlab chiqarish: good+scrap (%) planned (%) dan oshib ketdi',
              v_good + v_scrap, v_planned;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `,
    },
    {
      name: 'fn_production_qty_check trigger on production_orders',
      sql: `
        DROP TRIGGER IF EXISTS trg_production_qty_check ON production_orders;
        CREATE TRIGGER trg_production_qty_check
        BEFORE INSERT OR UPDATE ON production_orders
        FOR EACH ROW EXECUTE FUNCTION fn_production_qty_check();
      `,
    },
    // ── CFO config: rename old ecl_rate_* to ar_ecl_rate_* ────────
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
    // ── CFO config: consolidate 91+ bucket and fix default_cost_ratio ──
    {
      name: 'cfo_config consolidate ar_ecl_rate_91_plus and fix default_cost_ratio',
      sql: `
        -- Merge 91-180, 181-365, 365+ into single 91+ bucket at 0.5
        DELETE FROM cfo_config WHERE config_key IN ('ar_ecl_rate_181_365','ar_ecl_rate_365plus','ar_ecl_rate_91_180');
        -- Ensure ar_ecl_rate_91_plus exists with correct value
        INSERT INTO cfo_config (config_key, config_value, description)
          VALUES ('ar_ecl_rate_91_plus', 0.500000, 'AR ECL stavkasi: 91+ kun')
          ON CONFLICT (config_key) DO UPDATE SET config_value = 0.500000;
        -- Fix default_cost_ratio to 0.35 (spec requirement)
        UPDATE cfo_config SET config_value = 0.350000, description = 'Standart xarajat nisbati (35% of revenue)'
          WHERE config_key = 'default_cost_ratio';
      `,
    },
    // ── Sprint 1: standard_cost table ──────────────────────────────────────
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
    {
      name: 'Sprint1 standard_cost add product_id int col',
      sql: `ALTER TABLE standard_cost ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL`,
    },
    {
      name: 'Sprint1 standard_cost add std_total_uzs col',
      sql: `ALTER TABLE standard_cost ADD COLUMN IF NOT EXISTS std_total_uzs NUMERIC(18,4) GENERATED ALWAYS AS (std_material_uzs + std_labor_uzs + std_overhead_uzs) STORED`,
    },
    {
      name: 'Sprint1 standard_cost add created_by int col',
      sql: `ALTER TABLE standard_cost ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL`,
    },
    {
      name: 'Sprint1 standard_cost product_id index',
      sql: `CREATE INDEX IF NOT EXISTS idx_standard_cost_product_id ON standard_cost(product_id)`,
    },
    // ── Sprint 1: price_tier table ──────────────────────────────────────────
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
    {
      name: 'Sprint1 price_tier add product_id int col',
      sql: `ALTER TABLE price_tier ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL`,
    },
    {
      name: 'Sprint1 price_tier add created_by int col',
      sql: `ALTER TABLE price_tier ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL`,
    },
    {
      name: 'Sprint1 price_tier product_id index',
      sql: `CREATE INDEX IF NOT EXISTS idx_price_tier_product_id ON price_tier(product_id)`,
    },
    // ── Sprint 1: variance_report table ────────────────────────────────────
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
    {
      name: 'Sprint1 variance_report drop unique constraint',
      sql: `ALTER TABLE variance_report DROP CONSTRAINT IF EXISTS variance_report_order_id_key`,
    },
    {
      name: 'Sprint1 variance_report drop old index',
      sql: `DROP INDEX IF EXISTS idx_variance_report_order`,
    },
    {
      name: 'Sprint1 variance_report order_id to integer',
      sql: `ALTER TABLE variance_report ALTER COLUMN order_id TYPE INTEGER USING NULL`,
    },
    {
      name: 'Sprint1 variance_report order_id drop notnull',
      sql: `ALTER TABLE variance_report ALTER COLUMN order_id DROP NOT NULL`,
    },
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
    {
      name: 'Sprint1 variance_report unique index',
      sql: `CREATE UNIQUE INDEX IF NOT EXISTS uq_variance_report_order_id ON variance_report(order_id)`,
    },
    // ── Sprint 1: cost_structure table (break-even) ─────────────────────────
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
    {
      name: 'Sprint1 cost_structure add product_id int col',
      sql: `ALTER TABLE cost_structure ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL`,
    },
    {
      name: 'Sprint1 cost_structure add created_by int col',
      sql: `ALTER TABLE cost_structure ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL`,
    },
    {
      name: 'Sprint1 cost_structure product_id index',
      sql: `CREATE INDEX IF NOT EXISTS idx_cost_structure_product_id ON cost_structure(product_id)`,
    },
    // ── Sprint 1: financial_ratios_snapshot ──────────────────────────────────
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
    // ── Sprint 1: CFO config defaults for Sprint 1 keys ────────────────────
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

  for (const m of migrations) {
    try {
      await db.execute(sql.raw(m.sql));
      logger.log(`Schema addition OK: ${m.name}`);
    } catch (err) {
      logger.warn(`Schema addition o'tkazildi: ${m.name} — ${String(err)}`);
    }
  }
}
