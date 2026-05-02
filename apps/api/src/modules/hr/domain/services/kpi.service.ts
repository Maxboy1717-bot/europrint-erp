import { Injectable, Logger } from '@nestjs/common';
import { Ok, Result, AppError } from '@common/result';

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
    const kpiScore = (achievement * 0.5 + qualityScore * 0.3 + metrics.oee * 0.2) / 100;

    let rating: 'excellent' | 'good' | 'satisfactory' | 'poor';
    if (kpiScore >= 0.9) rating = 'excellent';
    else if (kpiScore >= 0.75) rating = 'good';
    else if (kpiScore >= 0.6) rating = 'satisfactory';
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
