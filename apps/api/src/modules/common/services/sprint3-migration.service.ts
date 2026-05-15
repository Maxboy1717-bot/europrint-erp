/**
 * @module sprint3-migration.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ddlRun } from '@shared/db';
import { sql } from 'drizzle-orm';

/**
 * Sprint 3 Startup Migration
 *
 * Ensures all Sprint 3 tables exist before any Sprint 3 endpoint processes its
 * first request. Uses CREATE TABLE IF NOT EXISTS — idempotent and safe to run
 * multiple times. Runs as part of NestJS bootstrap (OnModuleInit hook).
 *
 * Tables managed here:
 *   - rfm_clusters        (TZ-41: RFM K-Means++ cluster assignments)
 *   - churn_model_params  (TZ-44: Churn gradient-descent model coefficients)
 *   - imposition_layouts  (TZ-32: Sheet imposition layout results)
 */
@Injectable()
export class Sprint3MigrationService implements OnModuleInit {
  private readonly logger = new Logger(Sprint3MigrationService.name);

  onModuleInit(): void { this._initBackground().catch((e) => this.logger.warn('[sprint3-migration.service] init failed' + e)); }


  private async _initBackground(): Promise<void> {
    try {
      await this.createRfmClusters();
      await this.createChurnModelParams();
      await this.createImpositionLayouts();
      await this.createForecastDefault();
      await this.createMaterializedViews();
      this.logger.log('Sprint 3 tables ensured (rfm_clusters, churn_model_params, imposition_layouts, forecast_series.id default, mv_* views)');
    } catch (e) {
      // Log and rethrow — a missing table is fatal: endpoint requests will fail at DB level
      this.logger.error(`Sprint 3 migration failed: ${String(e)}`);
      throw e;
    }
  }

  private async createRfmClusters(): Promise<void> {
    await ddlRun(sql`
      CREATE TABLE IF NOT EXISTS rfm_clusters (
        id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
        customer_id   TEXT        NOT NULL,
        cluster_id    INTEGER     NOT NULL,
        r_norm        DECIMAL(10,6) NOT NULL,
        f_norm        DECIMAL(10,6) NOT NULL,
        m_norm        DECIMAL(10,6) NOT NULL,
        segment_label TEXT        NOT NULL,
        calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await ddlRun(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS rfm_clusters_cust_calc_uq
        ON rfm_clusters(customer_id, calculated_at)
    `);
    await ddlRun(sql`
      CREATE INDEX IF NOT EXISTS rfm_clusters_cluster_idx ON rfm_clusters(cluster_id)
    `);
  }

  private async createChurnModelParams(): Promise<void> {
    await ddlRun(sql`
      CREATE TABLE IF NOT EXISTS churn_model_params (
        id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
        version       INTEGER     NOT NULL,
        coefficients  JSONB       NOT NULL,
        feature_names TEXT[]      NOT NULL,
        auc           DECIMAL(8,6) NOT NULL,
        trained_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        is_active     BOOLEAN     NOT NULL DEFAULT false,
        sample_size   INTEGER     NOT NULL
      )
    `);
    await ddlRun(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS churn_model_params_version_uq
        ON churn_model_params(version)
    `);
    await ddlRun(sql`
      CREATE INDEX IF NOT EXISTS churn_model_params_active_idx
        ON churn_model_params(is_active)
    `);
  }

  private async createImpositionLayouts(): Promise<void> {
    await ddlRun(sql`
      CREATE TABLE IF NOT EXISTS imposition_layouts (
        id             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
        sheet_width    DECIMAL(10,2) NOT NULL,
        sheet_height   DECIMAL(10,2) NOT NULL,
        product_count  INTEGER     NOT NULL,
        sheet_count    INTEGER     NOT NULL,
        utilization    DECIMAL(8,4) NOT NULL,
        placed_count   INTEGER     NOT NULL,
        unplaced_count INTEGER     NOT NULL DEFAULT 0,
        layout_json    JSONB       NOT NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await ddlRun(sql`
      CREATE INDEX IF NOT EXISTS imposition_layouts_created_idx
        ON imposition_layouts(created_at)
    `);
  }

  private async createForecastDefault(): Promise<void> {
    // Ensure forecast_series.id has a DB-level DEFAULT (created in Sprint 1 without DEFAULT)
    await ddlRun(sql`
      ALTER TABLE forecast_series ALTER COLUMN id SET DEFAULT gen_random_uuid()::text
    `);
  }

  private async createMaterializedViews(): Promise<void> {
    // Materialized views — cron refresh uchun zarur
    await ddlRun(sql`
      CREATE MATERIALIZED VIEW IF NOT EXISTS mv_sales_monthly AS
      SELECT
        DATE_TRUNC('month', created_at)::date AS month,
        COUNT(*)                              AS order_count,
        COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0) AS revenue
      FROM sales_orders
      GROUP BY 1
    `);
    await ddlRun(sql`
      CREATE MATERIALIZED VIEW IF NOT EXISTS mv_inventory_daily AS
      SELECT
        CURRENT_DATE AS day,
        COUNT(*)     AS item_count,
        COALESCE(SUM(quantity), 0) AS total_qty
      FROM stock_items
    `);
    await ddlRun(sql`
      CREATE MATERIALIZED VIEW IF NOT EXISTS mv_kpi_daily AS
      SELECT
        DATE(created_at)    AS day,
        COUNT(*)            AS session_count,
        ROUND(100.0 * COUNT(*) FILTER (WHERE quality_passed = true) / NULLIF(COUNT(*),0), 1) AS quality_rate
      FROM mes_sessions
      GROUP BY 1
    `);
  }
}
