/**
 * @module drizzle-crm-analytics.repo
 * @description Concrete repository for the CRM analytics services (DDD C.18).
 *   Centralises all raw `runQuery`/`rawSql`/`db.transaction` calls previously
 *   scattered across churn / cohort / funnel / k-means services.
 *
 *   Each method preserves the original SQL semantics — the goal is a pure
 *   move, not a behavioural change.
 * @layer Infrastructure (CRM analytics)
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db, rawSql, runQuery } from '@shared/db';
import type {
  ChurnMaxVersionRow,
  ChurnModelRow,
  CohortCountOrderRow,
  CohortRevenueOrderRow,
  FunnelStageRow,
  FunnelVelocityRow,
  ICrmAnalyticsRepo,
  RfmClusterRow,
} from './i-crm-analytics.repo';

@Injectable()
export class DrizzleCrmAnalyticsRepository implements ICrmAnalyticsRepo {
  // ----- Churn -----

  async findActiveChurnModel(): Promise<ChurnModelRow | null> {
    const rows = await runQuery<ChurnModelRow>(sql`
      SELECT coefficients
      FROM churn_model_params
      WHERE is_active = true
      ORDER BY trained_at DESC
      LIMIT 1
    `);
    return rows[0] ?? null;
  }

  async getMaxChurnModelVersion(): Promise<number> {
    const rows = await runQuery<ChurnMaxVersionRow>(sql`
      SELECT COALESCE(MAX(version), 0) AS v FROM churn_model_params
    `);
    const v = rows[0]?.v;
    return typeof v === 'number' && Number.isFinite(v) ? v : 0;
  }

  async persistChurnModel(
    version: number,
    coefficients: number[],
    featureNames: string[],
    auc: number,
    sampleSize: number,
  ): Promise<void> {
    const coefJson = JSON.stringify({ values: coefficients });
    const featuresSql = sql.join(featureNames.map(f => sql`${f}`), sql`, `);
    await db.transaction(async (tx) => {
      await tx.execute(sql`
        UPDATE churn_model_params SET is_active = false WHERE is_active = true
      `);
      await tx.execute(sql`
        INSERT INTO churn_model_params (version, coefficients, feature_names, auc, trained_at, is_active, sample_size)
        VALUES (
          ${version}, ${coefJson}::jsonb, ARRAY[${featuresSql}]::text[],
          ${auc}, NOW(), true, ${sampleSize}
        )
        ON CONFLICT (version) DO UPDATE SET
          coefficients = EXCLUDED.coefficients,
          auc          = EXCLUDED.auc,
          trained_at   = EXCLUDED.trained_at,
          is_active    = true,
          sample_size  = EXCLUDED.sample_size
      `);
    });
  }

  // ----- Cohort -----

  async getCohortCountOrders(cutoffIso: string): Promise<CohortCountOrderRow[]> {
    return runQuery<CohortCountOrderRow>(sql`
      SELECT customer_id::text, created_at::text AS completed_at
      FROM sales_orders
      WHERE customer_id IS NOT NULL
        AND created_at IS NOT NULL
        AND created_at >= ${cutoffIso}
      ORDER BY created_at ASC
      LIMIT 5000
    `);
  }

  async getCohortRevenueOrders(cutoffIso: string): Promise<CohortRevenueOrderRow[]> {
    return runQuery<CohortRevenueOrderRow>(sql`
      SELECT customer_id::text,
             created_at::text AS completed_at,
             COALESCE(total_amount, 0)::float AS revenue
      FROM sales_orders
      WHERE customer_id IS NOT NULL
        AND created_at IS NOT NULL
        AND created_at >= ${cutoffIso}
      ORDER BY created_at ASC
      LIMIT 5000
    `);
  }

  // ----- Funnel -----

  async getFunnelStageData(pipelineId?: string): Promise<FunnelStageRow[]> {
    return runQuery<FunnelStageRow>(
      pipelineId
        ? sql`
          SELECT cs.name AS stage_name, COUNT(*)::int AS count,
            COALESCE(cs.is_success, false) AS is_won,
            COALESCE(cs.is_fail,    false) AS is_lost
          FROM crm_deals d
          JOIN crm_stages cs ON cs.id::text = d.stage_id
          WHERE d.pipeline_id = ${pipelineId} AND d.deleted_at IS NULL
          GROUP BY cs.name, cs.is_success, cs.is_fail, cs.sort_order
          ORDER BY cs.sort_order ASC
        `
        : sql`
          SELECT cs.name AS stage_name, COUNT(*)::int AS count,
            COALESCE(cs.is_success, false) AS is_won,
            COALESCE(cs.is_fail,    false) AS is_lost
          FROM crm_deals d
          JOIN crm_stages cs ON cs.id::text = d.stage_id
          WHERE d.deleted_at IS NULL
          GROUP BY cs.name, cs.is_success, cs.is_fail, cs.sort_order
          ORDER BY cs.sort_order ASC
        `,
    );
  }

  async getFunnelVelocityData(): Promise<FunnelVelocityRow> {
    const rows = await runQuery<FunnelVelocityRow>(sql`
      SELECT
        COUNT(*) FILTER (WHERE stage_semantic_id NOT IN ('WON','LOST') OR stage_semantic_id IS NULL)::int AS active_deals,
        COUNT(*) FILTER (WHERE stage_semantic_id = 'WON')::int  AS won_count,
        COUNT(*) FILTER (WHERE stage_semantic_id IN ('WON','LOST'))::int AS closed_count,
        COALESCE(AVG(opportunity::numeric), 0)::float            AS avg_deal_size,
        COALESCE(AVG(
          EXTRACT(DAY FROM (close_date::timestamp - date_create))
        ) FILTER (WHERE close_date IS NOT NULL), 30)::float      AS avg_cycle_days
      FROM crm_deals
      WHERE deleted_at IS NULL
    `);
    return rows[0] ?? { active_deals: 0, won_count: 0, closed_count: 0, avg_deal_size: 0, avg_cycle_days: 30 };
  }

  // ----- K-Means -----

  async upsertRfmCluster(row: RfmClusterRow, calculatedAtIso: string): Promise<void> {
    await rawSql(sql`
      INSERT INTO rfm_clusters
        (customer_id, cluster_id, r_norm, f_norm, m_norm, segment_label, calculated_at)
      VALUES
        (${row.customerId}, ${row.clusterId}, ${row.rNorm}, ${row.fNorm}, ${row.mNorm}, ${row.segmentLabel}, ${calculatedAtIso})
      ON CONFLICT (customer_id, calculated_at)
      DO UPDATE SET
        cluster_id = EXCLUDED.cluster_id, r_norm = EXCLUDED.r_norm,
        f_norm = EXCLUDED.f_norm, m_norm = EXCLUDED.m_norm, segment_label = EXCLUDED.segment_label
    `);
  }
}
