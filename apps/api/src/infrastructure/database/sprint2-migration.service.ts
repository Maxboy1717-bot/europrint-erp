import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { ddlRun, runQuery } from '@shared/db';

/**
 * Sprint 2 schema bootstrap — runs AFTER all modules initialise.
 * Tables are defined canonically in shared/db/schema-sprint2.ts (Drizzle schema).
 * This service idempotently creates them via CREATE TABLE IF NOT EXISTS and
 * ALTER TABLE ADD CONSTRAINT (with duplicate-object guard) until a full
 * drizzle-kit migration pipeline is in place.
 *
 * Table list mirrors schema-sprint2.ts exactly — any divergence is a bug.
 * Separation of concerns: DDL is infrastructure, not application logic.
 */
@Injectable()
export class Sprint2MigrationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(Sprint2MigrationService.name);

  onApplicationBootstrap(): void {
    this._runBackground().catch((e: unknown) =>
      this.logger.warn(`Sprint2Migration background failed: ${String(e)}`),
    );
  }

  private async _runBackground(): Promise<void> {
    await this.ensureTables();
    await this.ensureConstraints();
  }

  // ─── Table Creation ─────────────────────────────────────────────────────────

  private async ensureTables(): Promise<void> {
    // 1. WMS: Supplier Price Tiers (EOQ All-Units Quantity Discounts)
    await ddlRun(sql`
      CREATE TABLE IF NOT EXISTS supplier_price_tiers (
        id          SERIAL PRIMARY KEY,
        supplier_id INTEGER,
        material_id INTEGER NOT NULL CHECK (material_id > 0),
        min_qty     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (min_qty >= 0),
        max_qty     NUMERIC(12,2) CHECK (max_qty IS NULL OR max_qty > min_qty),
        unit_price  NUMERIC(18,4) NOT NULL CHECK (unit_price > 0),
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `).catch((e: Error) => this.logger.error(`supplier_price_tiers create failed: ${e.message}`));

    // 2. WMS: Inventory Policy (Safety Stock, ROP, EOQ, Lead Time, ABC)
    await ddlRun(sql`
      CREATE TABLE IF NOT EXISTS inventory_policy (
        id                 SERIAL PRIMARY KEY,
        material_id        INTEGER NOT NULL UNIQUE CHECK (material_id > 0),
        eoq                NUMERIC(12,2) DEFAULT 0 CHECK (eoq IS NULL OR eoq >= 0),
        safety_stock       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (safety_stock >= 0),
        reorder_point      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (reorder_point >= 0),
        lead_time_days     INTEGER DEFAULT 1 CHECK (lead_time_days IS NULL OR lead_time_days > 0),
        review_period_days INTEGER DEFAULT 7 CHECK (review_period_days IS NULL OR review_period_days > 0),
        abc_class          TEXT DEFAULT 'C' CHECK (abc_class IN ('A','B','C')),
        service_level      NUMERIC(5,4) DEFAULT 0.95
                             CHECK (service_level IS NULL OR (service_level > 0 AND service_level < 1)),
        lot_sizing_method  TEXT DEFAULT 'EOQ'
                             CHECK (lot_sizing_method IN ('L4L','EOQ','POQ','WAGNER_WHITIN')),
        updated_at         TIMESTAMPTZ DEFAULT NOW()
      )
    `).catch((e: Error) => this.logger.error(`inventory_policy create failed: ${e.message}`));

    // 3. WMS: Material Recommendation (EOQ calculation results)
    await ddlRun(sql`
      CREATE TABLE IF NOT EXISTS material_recommendation (
        id                SERIAL PRIMARY KEY,
        material_id       INTEGER NOT NULL UNIQUE CHECK (material_id > 0),
        eoq_qty           NUMERIC(12,2) NOT NULL CHECK (eoq_qty > 0),
        total_cost        NUMERIC(18,2) CHECK (total_cost IS NULL OR total_cost >= 0),
        order_frequency   NUMERIC(8,4) CHECK (order_frequency IS NULL OR order_frequency > 0),
        cycle_time_days   NUMERIC(8,2) CHECK (cycle_time_days IS NULL OR cycle_time_days > 0),
        calculated_at     TIMESTAMPTZ DEFAULT NOW(),
        lot_sizing_method TEXT DEFAULT 'EOQ'
                           CHECK (lot_sizing_method IN ('L4L','EOQ','POQ','WAGNER_WHITIN'))
      )
    `).catch((e: Error) => this.logger.error(`material_recommendation create failed: ${e.message}`));

    // Backfill Sprint-2 columns into pre-existing material_recommendation table (which has different schema).
    // In fresh environments the CREATE TABLE above already has the Sprint-2 columns; these are no-ops.
    await ddlRun(sql`
      ALTER TABLE material_recommendation
        ADD COLUMN IF NOT EXISTS eoq_qty           NUMERIC(12,2),
        ADD COLUMN IF NOT EXISTS total_cost        NUMERIC(18,2),
        ADD COLUMN IF NOT EXISTS order_frequency   NUMERIC(8,4),
        ADD COLUMN IF NOT EXISTS cycle_time_days   NUMERIC(8,2),
        ADD COLUMN IF NOT EXISTS calculated_at     TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS lot_sizing_method TEXT
    `).catch((e: Error) => this.logger.warn(`material_recommendation augment skipped: ${e.message}`));

    // Ensure unique index on material_id for ON CONFLICT (material_id) upsert
    await ddlRun(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS material_recommendation_material_id_uq
        ON material_recommendation (material_id)
    `).catch((e: Error) => this.logger.warn(`material_recommendation unique idx skipped: ${e.message}`));

    // Set default for recommendation_type so Sprint-2 INSERTs don't need to supply it
    await ddlRun(sql`
      ALTER TABLE material_recommendation
        ALTER COLUMN recommendation_type SET DEFAULT 'EOQ'
    `).catch((e: Error) => this.logger.warn(`material_recommendation default skipped: ${e.message}`));

    // 4. PP: MPS Periods
    await ddlRun(sql`
      CREATE TABLE IF NOT EXISTS mps_periods (
        id         SERIAL PRIMARY KEY,
        product_id TEXT NOT NULL CHECK (product_id <> ''),
        period     TEXT NOT NULL CHECK (period <> ''),
        quantity   NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
        due_date   TEXT NOT NULL,
        source     TEXT NOT NULL DEFAULT 'manual',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (product_id, period)
      )
    `).catch((e: Error) => this.logger.error(`mps_periods create failed: ${e.message}`));

    // Backfill Sprint-2 columns into pre-existing mps_periods table (which has period_start/planned_qty).
    // In fresh environments the CREATE TABLE above already has the Sprint-2 columns; these are no-ops.
    await ddlRun(sql`
      ALTER TABLE mps_periods
        ADD COLUMN IF NOT EXISTS period   TEXT,
        ADD COLUMN IF NOT EXISTS quantity NUMERIC(12,2),
        ADD COLUMN IF NOT EXISTS due_date TEXT,
        ADD COLUMN IF NOT EXISTS source   TEXT NOT NULL DEFAULT 'manual'
    `).catch((e: Error) => this.logger.warn(`mps_periods augment skipped: ${e.message}`));

    // Populate Sprint-2 columns from legacy period_start / planned_qty when present and empty
    await ddlRun(sql`
      UPDATE mps_periods
         SET period   = COALESCE(period,   TO_CHAR(period_start, 'IYYY-"W"IW')),
             quantity = COALESCE(quantity, planned_qty, 0),
             due_date = COALESCE(due_date, period_start::text)
       WHERE (period IS NULL OR quantity IS NULL OR due_date IS NULL)
         AND period_start IS NOT NULL
    `).catch((e: Error) => this.logger.warn(`mps_periods backfill skipped: ${e.message}`));

    // 5. PP: MRP Run Log — mirrors pp_mrp_runs in schema-sprint2.ts exactly
    await ddlRun(sql`
      CREATE TABLE IF NOT EXISTS pp_mrp_runs (
        id                SERIAL PRIMARY KEY,
        run_at            TIMESTAMPTZ DEFAULT NOW(),
        lot_sizing_method TEXT NOT NULL DEFAULT 'L4L'
                            CHECK (lot_sizing_method IN ('L4L','EOQ','POQ','WAGNER_WHITIN')),
        status            TEXT NOT NULL DEFAULT 'running'
                            CHECK (status IN ('running','completed','failed')),
        run_by            TEXT,
        notes             TEXT,
        horizon_periods   INTEGER NOT NULL DEFAULT 6 CHECK (horizon_periods > 0 AND horizon_periods <= 52)
      )
    `).catch((e: Error) => this.logger.error(`pp_mrp_runs create failed: ${e.message}`));

    // 6. PP: MRP Run Lines — mirrors pp_mrp_run_lines in schema-sprint2.ts exactly
    //    material_id is TEXT (product/material code, not FK int) per schema
    await ddlRun(sql`
      CREATE TABLE IF NOT EXISTS pp_mrp_run_lines (
        id                  SERIAL PRIMARY KEY,
        run_id              INTEGER NOT NULL REFERENCES pp_mrp_runs(id) ON DELETE CASCADE,
        material_id         TEXT NOT NULL CHECK (material_id <> ''),
        period              TEXT NOT NULL,
        gross_req           NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (gross_req >= 0),
        on_hand             NUMERIC(12,2) NOT NULL DEFAULT 0,
        scheduled_receipts  NUMERIC(12,2) NOT NULL DEFAULT 0,
        net_req             NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (net_req >= 0),
        planned_order       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (planned_order >= 0),
        release_date        TEXT
      )
    `).catch((e: Error) => this.logger.error(`pp_mrp_run_lines create failed: ${e.message}`));

    // 7. PP: Product Learning Curves — mirrors product_learning_curves in schema-sprint2.ts
    await ddlRun(sql`
      CREATE TABLE IF NOT EXISTS product_learning_curves (
        id                   SERIAL PRIMARY KEY,
        product_id           TEXT NOT NULL UNIQUE CHECK (product_id <> ''),
        operation_name       TEXT,
        t1_hours             NUMERIC(8,4) NOT NULL CHECK (t1_hours > 0),
        learning_rate        NUMERIC(5,4) NOT NULL DEFAULT 0.800
                               CHECK (learning_rate > 0 AND learning_rate < 1),
        units_produced       INTEGER DEFAULT 0 CHECK (units_produced >= 0),
        current_unit_hours   NUMERIC(8,4) CHECK (current_unit_hours IS NULL OR current_unit_hours > 0),
        updated_at           TIMESTAMPTZ DEFAULT NOW()
      )
    `).catch((e: Error) => this.logger.error(`product_learning_curves create failed: ${e.message}`));

    // 8. PP: Routing Operations — CREATE or AUGMENT to match schema-sprint2.ts
    // CREATE TABLE IF NOT EXISTS handles new environments; ALTER TABLE handles pre-existing tables.
    await ddlRun(sql`
      CREATE TABLE IF NOT EXISTS pp_routing_operations (
        id                    SERIAL PRIMARY KEY,
        product_id            TEXT,
        work_center_id        TEXT NOT NULL DEFAULT '',
        sequence              INTEGER NOT NULL DEFAULT 10,
        setup_time_min        NUMERIC(8,2) NOT NULL DEFAULT 0,
        run_time_per_unit_min NUMERIC(8,4) NOT NULL DEFAULT 1,
        is_active             BOOLEAN NOT NULL DEFAULT TRUE,
        created_at            TIMESTAMPTZ DEFAULT NOW()
      )
    `).catch((e: Error) => this.logger.error(`pp_routing_operations create failed: ${e.message}`));

    // Backfill Sprint-2 columns into pre-existing pp_routing_operations table
    await runQuery(sql`
      ALTER TABLE pp_routing_operations
        ADD COLUMN IF NOT EXISTS product_id            TEXT,
        ADD COLUMN IF NOT EXISTS setup_time_min        NUMERIC(8,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS run_time_per_unit_min NUMERIC(8,4) NOT NULL DEFAULT 1
    `).catch((e: Error) => this.logger.warn(`pp_routing_operations augment skipped: ${e.message}`));

    // Populate product_id from routings join (idempotent; only updates NULL rows)
    await runQuery(sql`
      UPDATE pp_routing_operations pro
      SET product_id = r.product_id::text
      FROM routings r
      WHERE r.id = pro.routing_id
        AND pro.product_id IS NULL
        AND pro.routing_id IS NOT NULL
    `).catch((e: Error) => this.logger.warn(`pp_routing_operations product_id backfill skipped: ${e.message}`));

    // Populate setup_time_min/run_time_per_unit_min from hours columns if present (idempotent)
    await runQuery(sql`
      UPDATE pp_routing_operations
      SET setup_time_min        = ROUND(COALESCE(setup_hours, 0) * 60, 2),
          run_time_per_unit_min = ROUND(COALESCE(run_hours_per_unit, 1) * 60, 4)
      WHERE setup_time_min = 0 AND run_time_per_unit_min = 1
    `).catch(() => { /* hours columns may not exist on fresh installs — ignore */ });

    // 9. Augment mm_purchase_orders with delivery-date columns used by MRP SR and SS queries.
    //    These extend the existing ERP table; ADD COLUMN IF NOT EXISTS is always safe.
    await runQuery(sql`
      ALTER TABLE mm_purchase_orders
        ADD COLUMN IF NOT EXISTS expected_delivery_date TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS actual_delivery_date   TIMESTAMPTZ
    `).catch((e: Error) => this.logger.error(`mm_purchase_orders augment failed: ${e.message}`));

    this.logger.log('Sprint 2 schema bootstrap complete (8 tables + 2 augment columns)');
  }

  // ─── Idempotent Constraint Backfill ─────────────────────────────────────────
  /**
   * ALTER TABLE ADD CONSTRAINT wrapped in DO $$ BEGIN ... EXCEPTION WHEN duplicate_object END $$
   * so running this repeatedly on existing tables is safe.
   */
  private async ensureConstraints(): Promise<void> {
    const constraints: Array<{ table: string; name: string; definition: string }> = [
      { table: 'supplier_price_tiers',   name: 'spt_unit_price_pos',          definition: 'CHECK (unit_price > 0)' },
      { table: 'supplier_price_tiers',   name: 'spt_min_qty_nonneg',           definition: 'CHECK (min_qty >= 0)' },
      { table: 'inventory_policy',       name: 'ip_safety_stock_nonneg',       definition: 'CHECK (safety_stock >= 0)' },
      { table: 'inventory_policy',       name: 'ip_reorder_point_nonneg',      definition: 'CHECK (reorder_point >= 0)' },
      { table: 'inventory_policy',       name: 'ip_lead_time_pos',             definition: 'CHECK (lead_time_days IS NULL OR lead_time_days > 0)' },
      { table: 'inventory_policy',       name: 'ip_service_level_range',       definition: 'CHECK (service_level IS NULL OR (service_level > 0 AND service_level < 1))' },
      { table: 'inventory_policy',       name: 'ip_abc_class_enum',            definition: "CHECK (abc_class IN ('A','B','C'))" },
      { table: 'material_recommendation', name: 'mr_eoq_qty_pos',             definition: 'CHECK (eoq_qty > 0)' },
      { table: 'pp_mrp_run_lines',       name: 'mrpl_gross_req_nonneg',        definition: 'CHECK (gross_req >= 0)' },
      { table: 'pp_mrp_run_lines',       name: 'mrpl_net_req_nonneg',          definition: 'CHECK (net_req >= 0)' },
      { table: 'pp_mrp_run_lines',       name: 'mrpl_planned_order_nonneg',    definition: 'CHECK (planned_order >= 0)' },
      { table: 'mps_periods',            name: 'mps_quantity_nonneg',          definition: 'CHECK (quantity >= 0)' },
      { table: 'product_learning_curves', name: 'plc_t1_hours_pos',           definition: 'CHECK (t1_hours > 0)' },
      { table: 'product_learning_curves', name: 'plc_learning_rate_range',     definition: 'CHECK (learning_rate > 0 AND learning_rate < 1)' },
      { table: 'pp_routing_operations',  name: 'pro_run_time_pos',             definition: 'CHECK (run_time_per_unit_min > 0)' },
      { table: 'pp_routing_operations',  name: 'pro_sequence_pos',             definition: 'CHECK (sequence > 0)' },
    ];

    for (const { table, name, definition } of constraints) {
      await runQuery(sql`
        DO $do$
        BEGIN
          ALTER TABLE ${sql.raw(table)} ADD CONSTRAINT ${sql.raw(name)} ${sql.raw(definition)};
        EXCEPTION WHEN duplicate_object THEN
          NULL;
        END
        $do$
      `).catch((e: Error) =>
        this.logger.debug(`Constraint ${name} on ${table} not applied: ${e.message}`),
      );
    }

    this.logger.log('Sprint 2 schema constraints ensured');
  }
}
