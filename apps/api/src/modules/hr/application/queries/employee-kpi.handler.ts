import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { HrRepository } from '../../infrastructure/repositories/drizzle-hr.repo';
import { KpiService } from '../../domain/services/kpi.service';
import { Result, Ok, Err } from '@common/result';

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
          overallScore: achievement * 0.5 + quality * 0.3 + avgOee * 0.2,
          rating: kpi.rating,
        },
        trend,
      });
  }
}
