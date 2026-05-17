/**
 * @module i-crm-analytics.repo
 * @description Domain repository interface for CRM Analytics services
 *   (churn / cohort / funnel / k-means).
 *
 *   The five analytics services historically imported `runQuery` directly
 *   from `@shared/db`. This interface centralises their data-access calls so
 *   the services depend on an abstraction (DDD C.18).
 *
 *   Concrete implementation: `./drizzle-crm-analytics.repo.ts`.
 *   Injection token: `CRM_ANALYTICS_REPO`.
 * @layer Domain (CRM analytics)
 */

export const CRM_ANALYTICS_REPO = Symbol('CRM_ANALYTICS_REPO');

// ---------- Churn types ----------
export interface ChurnModelRow {
  coefficients: { values: number[] };
}

export interface ChurnMaxVersionRow {
  v: number;
}

// ---------- Cohort types ----------
export interface CohortCountOrderRow {
  customer_id: string;
  completed_at: string;
}

export interface CohortRevenueOrderRow {
  customer_id: string;
  completed_at: string;
  revenue: number;
}

// ---------- Funnel types ----------
export interface FunnelStageRow {
  stage_name: string;
  count: number;
  is_won: boolean;
  is_lost: boolean;
}

export interface FunnelVelocityRow {
  active_deals: number;
  won_count: number;
  closed_count: number;
  avg_deal_size: number;
  avg_cycle_days: number;
}

// ---------- K-Means persistence input ----------
export interface RfmClusterRow {
  customerId: string;
  clusterId: number;
  rNorm: number;
  fNorm: number;
  mNorm: number;
  segmentLabel: string;
}

export interface ICrmAnalyticsRepo {
  /** Load the currently-active churn model's coefficient row. */
  findActiveChurnModel(): Promise<ChurnModelRow | null>;

  /** MAX(version) over churn_model_params (defaults to 0 when empty). */
  getMaxChurnModelVersion(): Promise<number>;

  /** Deactivate currently-active model + insert a new active row in a single tx. */
  persistChurnModel(
    version: number,
    coefficients: number[],
    featureNames: string[],
    auc: number,
    sampleSize: number,
  ): Promise<void>;

  /** Cohort analysis — count mode (one row per order). */
  getCohortCountOrders(cutoffIso: string): Promise<CohortCountOrderRow[]>;

  /** Cohort analysis — revenue mode (order + total_amount). */
  getCohortRevenueOrders(cutoffIso: string): Promise<CohortRevenueOrderRow[]>;

  /** Funnel: deals grouped by stage, optionally filtered by pipeline_id. */
  getFunnelStageData(pipelineId?: string): Promise<FunnelStageRow[]>;

  /** Funnel: aggregate pipeline-velocity metrics (one row). */
  getFunnelVelocityData(): Promise<FunnelVelocityRow>;

  /** Persist k-means cluster assignments (UPSERT per customer × calculated_at). */
  upsertRfmCluster(row: RfmClusterRow, calculatedAtIso: string): Promise<void>;
}
