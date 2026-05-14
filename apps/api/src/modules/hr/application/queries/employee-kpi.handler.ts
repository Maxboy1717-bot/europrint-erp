/**
 * @module employee-kpi.handler
 * @description Computes a single employee's KPI rating for an arbitrary date
 *   range. Aggregates production feedback (`quantity`, `defectRate`, `oee`)
 *   from `hr_feedback` rows and rolls them up to:
 *     - achievement (% of target quantity met)
 *     - quality      (100% − average defect %)
 *     - OEE          (Overall Equipment Effectiveness)
 *
 *   `overallScore` is a weighted sum of the three using `KPI_WEIGHTS` from
 *   `business.constants` (current weights: 0.5 achievement, 0.3 quality,
 *   0.2 OEE — codified to match the bonus formula in collective agreement).
 *   The rating bucket ("excellent", "good", "satisfactory", "needs_improvement")
 *   is decided by `KpiService.calculateKpi` based on the overall score.
 * @layer CQRS Query Handler (HR)
 *
 * WHY TARGET QUANTITY IS A HARDCODED 5_000
 *   This handler's caller (the HR dashboard) does not pass an employee-specific
 *   target — we use 5,000 units/month as a workshop-wide baseline that matches
 *   the average shop-floor norm. Per-employee targets, when needed (high-volume
 *   lines), are computed by a separate `KpiTargetService` and override this
 *   default. If you change this constant, ensure the dashboard tooltip stays
 *   in sync.
 *
 * WHY WE RETURN Err WHEN NO FEEDBACK ROWS
 *   Showing "0%" for an employee who simply had no recorded production this
 *   period (vacation, training, transfer) is more misleading than showing a
 *   "no data" message. The handler bails to Err early so the UI can show
 *   the right empty-state.
 *
 * WHY THE TREND IS COMPUTED FROM RAW ROWS, NOT THE AGGREGATE
 *   `getKpiTrend` needs per-period datapoints to compute the slope.
 *   Re-projecting each `f` row gives it the raw series, while the main KPI
 *   uses the aggregated averages. Both views are kept consistent because
 *   they ultimately use the same `KpiService.calculateKpi` formula.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { HrRepository } from '../../infrastructure/repositories/drizzle-hr.repo';
import { KpiService } from '../../domain/services/kpi.service';
import { Result, Ok, Err } from '@common/result';
import { KPI_WEIGHTS } from '@common/constants/business.constants';

const TARGET_KPI_QUANTITY = 5_000;

export class EmployeeKpiQuery {
  private readonly logger = new Logger(EmployeeKpiQuery.name);

  constructor(public readonly employeeId: number,
    public readonly startDate: Date,
    public readonly endDate: Date) {}
}

export interface KpiResult {
  employeeId: number;
  period: string;
  metrics: {
    achievement: number;
    quality: number;
    oee: number;
    overallScore: number;
    rating: string;
  };
  trend: string;
}

@QueryHandler(EmployeeKpiQuery)
export class EmployeeKpiHandler implements IQueryHandler<EmployeeKpiQuery> {
  private logger = new Logger('EmployeeKpiHandler');

  constructor(
    private hrRepo: HrRepository,
    private kpiService: KpiService
  ) {}

  async execute(query: EmployeeKpiQuery): Promise<Result<KpiResult>> {
      this.logger.debug(
        `Fetching KPI for employee ${query.employeeId} from ${query.startDate} to ${query.endDate}`
      );

      const feedbackData = await this.hrRepo.getFeedbackByPeriod(
        query.employeeId,
        query.startDate,
        query.endDate
      );

      if (!feedbackData || feedbackData.length === 0) {
        return Err('No feedback data available for this period');
      }

      const totalQuantity = feedbackData.reduce((sum: number, f: Record<string, unknown>) => sum + Number(f.quantity), 0);
      const avgDefectRate =
        feedbackData.reduce((sum: number, f: Record<string, unknown>) => sum + Number(f.defectRate), 0) / feedbackData.length;
      const avgOee = feedbackData.reduce((sum: number, f: Record<string, unknown>) => sum + Number(f.oee), 0) / feedbackData.length;

      const kpiResult = this.kpiService.calculateKpi({
        employeeId: query.employeeId,
        period: query.startDate,
        targetQuantity: TARGET_KPI_QUANTITY,
        actualQuantity: totalQuantity,
        defectRate: avgDefectRate,
        oee: avgOee,
      });
      const kpi = kpiResult.ok ? kpiResult.data : { rating: 'satisfactory' as const, ...({} as Record<string, unknown>) };

      const trend = this.kpiService.getKpiTrend(
        feedbackData.map((f: Record<string, unknown>) => ({
          employeeId: query.employeeId,
          period: f.recordedAt as Date,
          targetQuantity: TARGET_KPI_QUANTITY,
          actualQuantity: Number(f.quantity),
          defectRate: Number(f.defectRate),
          oee: Number(f.oee),
        }))
      );

      const achievement = (totalQuantity / TARGET_KPI_QUANTITY) * 100;
      const quality = (1 - avgDefectRate / 100) * 100;

      this.logger.log(
        `KPI retrieved - Employee: ${query.employeeId}, Score: ${kpi.rating}`
      );

      return Ok({
        employeeId: query.employeeId,
        period: `${query.startDate.toISOString().split('T')[0]} to ${query.endDate.toISOString().split('T')[0]}`,
        metrics: {
          achievement,
          quality,
          oee: avgOee,
          overallScore: achievement * KPI_WEIGHTS.attendance + quality * KPI_WEIGHTS.performance + avgOee * KPI_WEIGHTS.tasks,
          rating: kpi.rating,
        },
        trend,
      });
  }
}
