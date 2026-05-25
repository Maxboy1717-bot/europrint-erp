/**
 * @module sprint2-migration.helpers
 * @description DDL helper functions extracted from sprint2-migration.service.ts
 *   (MRP / routing / purchase-orders blocks) to keep service file <300 lines (Rule 16).
 */

import type { Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { ddlRun, runQuery } from '@shared/db';

export async function createMrpRunsTable(logger: Logger): Promise<void> {
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
  `).catch((e: Error) => logger.error(`pp_mrp_runs create failed: ${e.message}`));
}

export async function createMrpRunLinesTable(logger: Logger): Promise<void> {
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
  `).catch((e: Error) => logger.error(`pp_mrp_run_lines create failed: ${e.message}`));
}

export async function createProductLearningCurvesTable(logger: Logger): Promise<void> {
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
  `).catch((e: Error) => logger.error(`product_learning_curves create failed: ${e.message}`));
}

export async function createMrpTables(logger: Logger): Promise<void> {
  await createMrpRunsTable(logger);
  await createMrpRunLinesTable(logger);
  await createProductLearningCurvesTable(logger);
}

export async function ensureRoutingOperations(logger: Logger): Promise<void> {
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
  `).catch((e: Error) => logger.error(`pp_routing_operations create failed: ${e.message}`));
  await runQuery(sql`
    ALTER TABLE pp_routing_operations
      ADD COLUMN IF NOT EXISTS product_id            TEXT,
      ADD COLUMN IF NOT EXISTS setup_time_min        NUMERIC(8,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS run_time_per_unit_min NUMERIC(8,4) NOT NULL DEFAULT 1
  `).catch((e: Error) => logger.warn(`pp_routing_operations augment skipped: ${e.message}`));
  await runQuery(sql`
    UPDATE pp_routing_operations pro
    SET product_id = r.product_id::text
    FROM routings r
    WHERE r.id = pro.routing_id
      AND pro.product_id IS NULL
      AND pro.routing_id IS NOT NULL
  `).catch((e: Error) => logger.warn(`pp_routing_operations product_id backfill skipped: ${e.message}`));
  await runQuery(sql`
    UPDATE pp_routing_operations
    SET setup_time_min        = ROUND(COALESCE(setup_hours, 0) * 60, 2),
        run_time_per_unit_min = ROUND(COALESCE(run_hours_per_unit, 1) * 60, 4)
    WHERE setup_time_min = 0 AND run_time_per_unit_min = 1
  `).catch(() => { /* hours columns may not exist on fresh installs — ignore */ });
}

export async function augmentPurchaseOrders(logger: Logger): Promise<void> {
  await runQuery(sql`
    ALTER TABLE mm_purchase_orders
      ADD COLUMN IF NOT EXISTS expected_delivery_date TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS actual_delivery_date   TIMESTAMPTZ
  `).catch((e: Error) => logger.error(`mm_purchase_orders augment failed: ${e.message}`));
}
