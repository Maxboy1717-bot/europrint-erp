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

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db, rawSql, runQuery } from '@shared/db';
import { Ok, Err, Result } from '@common/result';
import type {
  ChurnMaxVersionRow,
  ChurnModelRow,
  CohortCountOrderRow,
  CohortRevenueOrderRow,
  FunnelStageRow,
  FunnelVelocityRow,
  ICrmAnalyticsRepo,
  LossReasonRollupRow,
  RfmClusterRow,
} from './i-crm-analytics.repo';

@Injectable()
export class DrizzleCrmAnalyticsRepository implements ICrmAnalyticsRepo {
  private readonly logger = new Logger(DrizzleCrmAnalyticsRepository.name);

  // ----- Churn -----

  async findActiveChurnModel(): Promise<ChurnModelRow | null> {
    try {
      const rows = await runQuery<ChurnModelRow>(sql`
        SELECT coefficients
        FROM churn_model_params
        WHERE is_active = true
        ORDER BY trained_at DESC
        LIMIT 1
      `);
      return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    } catch (e: unknown) {
      this.logger.error(`findActiveChurnModel xatosi: ${(e as Error).message}`);
      throw e;
    }
  }

  async getMaxChurnModelVersion(): Promise<number> {
    try {
      const rows = await runQuery<ChurnMaxVersionRow>(sql`
        SELECT COALESCE(MAX(version), 0) AS v FROM churn_model_params
      `);
      const v = Array.isArray(rows) && rows.length > 0 ? rows[0]?.v : undefined;
      return typeof v === 'number' && Number.isFinite(v) ? v : 0;
    } catch (e: unknown) {
      this.logger.error(`getMaxChurnModelVersion xatosi: ${(e as Error).message}`);
      throw e;
    }
  }

  async persistChurnModel(
    version: number,
    coefficients: number[],
    featureNames: string[],
    auc: number,
    sampleSize: number,
  ): Promise<void> {
    try {
      const safeCoefficients = Array.isArray(coefficients) ? coefficients : [];
      const safeFeatures = Array.isArray(featureNames) ? featureNames : [];
      const coefJson = JSON.stringify({ values: safeCoefficients });
      const featuresSql = sql.join(safeFeatures.map(f => sql`${f}`), sql`, `);
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
    } catch (e: unknown) {
      this.logger.error(`persistChurnModel xatosi: ${(e as Error).message}`);
      throw e;
    }
  }

  // ----- Cohort -----

  async getCohortCountOrders(cutoffIso: string): Promise<CohortCountOrderRow[]> {
    try {
      const rows = await runQuery<CohortCountOrderRow>(sql`
        SELECT customer_id::text, created_at::text AS completed_at
        FROM sales_orders
        WHERE customer_id IS NOT NULL
          AND created_at IS NOT NULL
          AND created_at >= ${cutoffIso}
        ORDER BY created_at ASC
        LIMIT 5000
      `);
      return Array.isArray(rows) ? rows : [];
    } catch (e: unknown) {
      this.logger.error(`getCohortCountOrders xatosi: ${(e as Error).message}`);
      throw e;
    }
  }

  async getCohortRevenueOrders(cutoffIso: string): Promise<CohortRevenueOrderRow[]> {
    try {
      const rows = await runQuery<CohortRevenueOrderRow>(sql`
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
      return Array.isArray(rows) ? rows : [];
    } catch (e: unknown) {
      this.logger.error(`getCohortRevenueOrders xatosi: ${(e as Error).message}`);
      throw e;
    }
  }

  // ----- Funnel -----

  // crm_deals: category_id (Bitrix pipeline). crm_stages: is_won/is_lost are derived from
  // the live `semantics` column ({process,success,fail}), and ordering uses the live `sort`
  // column. Live crm_stages has NO is_success/is_fail/sort_order columns — those were
  // phantom and 503'd /api/crm/funnel.
  async getFunnelStageData(pipelineId?: string): Promise<FunnelStageRow[]> {
    try {
      const rows = await runQuery<FunnelStageRow>(
        pipelineId
          ? sql`
            SELECT cs.name AS stage_name, COUNT(*)::int AS count,
              (cs.semantics = 'success') AS is_won,
              (cs.semantics = 'fail')    AS is_lost
            FROM crm_deals d
            JOIN crm_stages cs ON cs.id::text = d.stage_id
            WHERE d.category_id::text = ${pipelineId} AND d.deleted_at IS NULL
            GROUP BY cs.name, cs.semantics, cs.sort
            ORDER BY cs.sort ASC
          `
          : sql`
            SELECT cs.name AS stage_name, COUNT(*)::int AS count,
              (cs.semantics = 'success') AS is_won,
              (cs.semantics = 'fail')    AS is_lost
            FROM crm_deals d
            JOIN crm_stages cs ON cs.id::text = d.stage_id
            WHERE d.deleted_at IS NULL
            GROUP BY cs.name, cs.semantics, cs.sort
            ORDER BY cs.sort ASC
          `,
      );
      return Array.isArray(rows) ? rows : [];
    } catch (e: unknown) {
      this.logger.error(`getFunnelStageData xatosi: ${(e as Error).message}`);
      throw e;
    }
  }

  async getFunnelVelocityData(): Promise<FunnelVelocityRow> {
    try {
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
      const head = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
      return head ?? { active_deals: 0, won_count: 0, closed_count: 0, avg_deal_size: 0, avg_cycle_days: 30 };
    } catch (e: unknown) {
      this.logger.error(`getFunnelVelocityData xatosi: ${(e as Error).message}`);
      throw e;
    }
  }

  // ----- Loss reasons (VISION-3340 #31) -----

  // Rollup of lost deals grouped by loss reason. NB: live crm_deals has a free-text
  // `lost_reason` (text) column — there is NO `lost_reason_id`, and crm_loss_reasons is
  // empty, so the previous JOIN on d.lost_reason_id raised
  // "столбец d.lost_reason_id не существует" and the endpoint 500'd on every call. Group by
  // the real free-text column, surfacing it as code/label_uz; lost_reason_id/label_ru stay
  // NULL (the response contract is preserved). Lost deals are identified by the app business
  // status in the free-form `stage_id` column (= 'lost'; compat crm_deals aliases status →
  // stage_id). Structured taxonomy (a real lost_reason_id column + seeded crm_loss_reasons)
  // is a separate owner-gated migration (Q-35).
  async getLossReasonRollup(): Promise<Result<LossReasonRollupRow[]>> {
    try {
      const rows = await runQuery<LossReasonRollupRow>(sql`
        SELECT
          NULL::int             AS lost_reason_id,
          d.lost_reason         AS code,
          d.lost_reason         AS label_uz,
          NULL::text            AS label_ru,
          COUNT(*)::int         AS deal_count
        FROM crm_deals d
        WHERE d.stage_id = 'lost' AND d.deleted_at IS NULL
        GROUP BY d.lost_reason
        ORDER BY deal_count DESC
      `);
      return Ok(Array.isArray(rows) ? rows : []);
    } catch (e: unknown) {
      this.logger.error(`getLossReasonRollup xatosi: ${(e as Error).message}`);
      return Err(`getLossReasonRollup: ${(e as Error).message}`);
    }
  }

  // ----- K-Means -----

  async upsertRfmCluster(row: RfmClusterRow, calculatedAtIso: string): Promise<void> {
    try {
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
    } catch (e: unknown) {
      this.logger.error(`upsertRfmCluster xatosi: ${(e as Error).message}`);
      throw e;
    }
  }
}
