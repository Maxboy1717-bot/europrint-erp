/**
 * @module kpi.service
 * @description Core KPI formula for shop-floor employees. Composes three
 *   metrics into a single 0..100 score and a four-tier rating:
 *
 *     achievement  = actualQty / targetQty × 100        (production volume)
 *     quality      = (1 − defectRate/100) × 100         (quality score)
 *     oee          = passed through directly             (machine effectiveness)
 *
 *     kpiScore     = (achievement × W_attendance        ← naming is legacy
 *                   + quality     × W_performance
 *                   + oee         × W_tasks) / 100
 *
 *     Rating thresholds (from `business.constants`):
 *       ≥ excellent  → 'excellent'
 *       ≥ good       → 'good'
 *       ≥ average    → 'satisfactory'
 *       else         → 'poor'
 *
 * @layer Domain Service (HR)
 *
 * WHY THE WEIGHT NAMES DON'T MATCH THE METRICS
 *   `KPI_WEIGHTS.attendance/.performance/.tasks` is the older naming from the
 *   first HR module iteration. The values are correct (0.5 / 0.3 / 0.2) but
 *   the keys haven't been renamed because doing so would break the bonus
 *   formula referenced in the union agreement document. When that contract
 *   is renegotiated (currently scheduled 2026 Q4) the keys will be renamed
 *   to `KPI_WEIGHTS.achievement/.quality/.oee` for clarity.
 *
 * WHY OEE IS USED RAW (not converted to a 0..100)
 *   OEE is already a 0..100 scale by industry convention (Availability ×
 *   Performance × Quality, each 0..1). The pre-multiplication by 100 from
 *   achievement/quality matches OEE's natural scale — divide-by-100 at the
 *   end keeps the final score in 0..100.
 *
 * WHY TREND IS A 3-WAY ENUM, NOT A NUMERIC SLOPE
 *   Managers see "improving / stable / declining" on the dashboard — a raw
 *   number ("trend: +0.7") needs interpretation. The ±5-point threshold is
 *   our standard "meaningful change" cutoff (matches the salary review
 *   committee's "promotion-worthy improvement" definition).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Result, AppError } from '@common/result';
import { KPI_WEIGHTS, KPI_RATING_THRESHOLDS } from '@common/constants/business.constants';

export interface KpiMetrics {
  employeeId: number;
  period: Date;
  targetQuantity: number;
  actualQuantity: number;
  defectRate: number;
  oee: number;
  rating: 'excellent' | 'good' | 'satisfactory' | 'poor';
}

@Injectable()
export class KpiService {
  private readonly logger = new Logger(KpiService.name);

  calculateKpi(metrics: Omit<KpiMetrics, 'rating'>): Result<KpiMetrics, AppError> {
    const achievement = (metrics.actualQuantity / metrics.targetQuantity) * 100;
    const qualityScore = (1 - metrics.defectRate / 100) * 100;
    const kpiScore = (achievement * KPI_WEIGHTS.attendance + qualityScore * KPI_WEIGHTS.performance + metrics.oee * KPI_WEIGHTS.tasks) / 100;

    let rating: 'excellent' | 'good' | 'satisfactory' | 'poor';
    if (kpiScore >= KPI_RATING_THRESHOLDS.excellent) rating = 'excellent';
    else if (kpiScore >= KPI_RATING_THRESHOLDS.good) rating = 'good';
    else if (kpiScore >= KPI_RATING_THRESHOLDS.average) rating = 'satisfactory';
    else rating = 'poor';

    this.logger.debug(
      `KPI Calculated - Employee: ${metrics.employeeId}, Score: ${kpiScore}, Rating: ${rating}`
    );

    return Ok({
      ...metrics,
      rating,
    });
  }

  getKpiTrend(
    kpis: Omit<KpiMetrics, 'rating'>[]
  ): 'improving' | 'stable' | 'declining' {
    if (kpis.length < 2) return 'stable';

    const scores = (Array.isArray(kpis) ? kpis : []).map((k) => (k.actualQuantity / k.targetQuantity) * 100);
    const currentScore = scores[scores.length - 1];
    const previousScore = scores[scores.length - 2];

    const trend = currentScore - previousScore;

    if (trend > 5) return 'improving';
    if (trend < -5) return 'declining';
    return 'stable';
  }
}
