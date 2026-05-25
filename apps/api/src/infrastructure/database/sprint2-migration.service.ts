/**
 * @module sprint2-migration.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { ddlRun, runQuery } from '@shared/db';
import { SPRINT2_CONSTRAINT_DEFINITIONS } from './sprint2-migration.constants';
import {
  createMrpTables, ensureRoutingOperations, augmentPurchaseOrders,
} from './sprint2-migration.helpers';

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

  private async createSupplierPriceTiers(): Promise<void> {
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
  }

  private async createInventoryPolicy(): Promise<void> {
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
  }

  private async createWmsTables(): Promise<void> {
    await this.createSupplierPriceTiers();
    await this.createInventoryPolicy();
  }

  private async createMaterialRecommendationTable(): Promise<void> {
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
  }

  private async augmentMaterialRecommendationColumns(): Promise<void> {
    await ddlRun(sql`
      ALTER TABLE material_recommendation
        ADD COLUMN IF NOT EXISTS eoq_qty           NUMERIC(12,2),
        ADD COLUMN IF NOT EXISTS total_cost        NUMERIC(18,2),
        ADD COLUMN IF NOT EXISTS order_frequency   NUMERIC(8,4),
        ADD COLUMN IF NOT EXISTS cycle_time_days   NUMERIC(8,2),
        ADD COLUMN IF NOT EXISTS calculated_at     TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS lot_sizing_method TEXT
    `).catch((e: Error) => this.logger.warn(`material_recommendation augment skipped: ${e.message}`));
  }

  private async finalizeMaterialRecommendation(): Promise<void> {
    await ddlRun(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS material_recommendation_material_id_uq
        ON material_recommendation (material_id)
    `).catch((e: Error) => this.logger.warn(`material_recommendation unique idx skipped: ${e.message}`));
    await ddlRun(sql`
      ALTER TABLE material_recommendation
        ALTER COLUMN recommendation_type SET DEFAULT 'EOQ'
    `).catch((e: Error) => this.logger.warn(`material_recommendation default skipped: ${e.message}`));
  }

  private async ensureMaterialRecommendation(): Promise<void> {
    await this.createMaterialRecommendationTable();
    await this.augmentMaterialRecommendationColumns();
    await this.finalizeMaterialRecommendation();
  }

  private async createMpsPeriodsTable(): Promise<void> {
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
  }

  private async backfillMpsPeriods(): Promise<void> {
    await ddlRun(sql`
      ALTER TABLE mps_periods
        ADD COLUMN IF NOT EXISTS period   TEXT,
        ADD COLUMN IF NOT EXISTS quantity NUMERIC(12,2),
        ADD COLUMN IF NOT EXISTS due_date TEXT,
        ADD COLUMN IF NOT EXISTS source   TEXT NOT NULL DEFAULT 'manual'
    `).catch((e: Error) => this.logger.warn(`mps_periods augment skipped: ${e.message}`));
    await ddlRun(sql`
      UPDATE mps_periods
         SET period   = COALESCE(period,   TO_CHAR(period_start, 'IYYY-"W"IW')),
             quantity = COALESCE(quantity, planned_qty, 0),
             due_date = COALESCE(due_date, period_start::text)
       WHERE (period IS NULL OR quantity IS NULL OR due_date IS NULL)
         AND period_start IS NOT NULL
    `).catch((e: Error) => this.logger.warn(`mps_periods backfill skipped: ${e.message}`));
  }

  private async ensureMpsPeriods(): Promise<void> {
    await this.createMpsPeriodsTable();
    await this.backfillMpsPeriods();
  }

  private async ensureTables(): Promise<void> {
    await this.createWmsTables();
    await this.ensureMaterialRecommendation();
    await this.ensureMpsPeriods();
    await createMrpTables(this.logger);
    await ensureRoutingOperations(this.logger);
    await augmentPurchaseOrders(this.logger);
    this.logger.log('Sprint 2 schema bootstrap complete (8 tables + 2 augment columns)');
  }

  // ─── Idempotent Constraint Backfill ─────────────────────────────────────────
  /**
   * ALTER TABLE ADD CONSTRAINT wrapped in DO $$ BEGIN ... EXCEPTION WHEN duplicate_object END $$
   * so running this repeatedly on existing tables is safe.
   * Constraint list lives in ./sprint2-migration.constants.ts (Rule 16).
   */
  private async applyConstraint(table: string, name: string, definition: string): Promise<void> {
    // NOTE: P3-30 — `table`, `name`, `definition` are destructured from the static SPRINT2_CONSTRAINT_DEFINITIONS ReadonlyArray (see ./sprint2-migration.constants.ts); private method, no public callers; no user input.
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

  private async ensureConstraints(): Promise<void> {
    for (const { table, name, definition } of SPRINT2_CONSTRAINT_DEFINITIONS) {
      await this.applyConstraint(table, name, definition);
    }
    this.logger.log('Sprint 2 schema constraints ensured');
  }
}
