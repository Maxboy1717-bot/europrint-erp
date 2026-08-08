/**
 * @module sales.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * Merged into sd module (PA3-17 Wave 3): originally lived in `modules/sales/`.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { SalesRepository } from './sales.repository';
import { FORECAST, FORECAST_CONFIDENCE_DEFAULT } from '@common/constants/business.constants';

@Injectable()
export class SalesService {
  constructor(private readonly repo: SalesRepository) {}

  async listInvoices(customerId: number | null, status: string | null, lim: number, off: number): Promise<Result<object, AppError>> {
    return this.repo.listInvoices(customerId, status, lim, off);
  }

  async getMonthlyTrend(months: number) {
    return this.repo.getMonthlyTrend(months);
  }

  async getVelocity(period: string | null) {
    return safeCall(async () => {
      const data = await this.repo.getVelocity();
      return { ...data, period: period ?? 'quarterly' };
    });
  }

  async getCommissionCalculations(managerId: number | null, period: string | null) {
    return safeCall(async () => {
      const commissions = await this.repo.getCommissionCalculations(managerId);
      return { commissions, period: period ?? 'monthly' };
    });
  }

  async getForecastAccuracy(managerId: number | null, months = 6) {
    return safeCall(async () => {
      const result = await this.repo.getForecastAccuracyData(managerId, months);
      if (!result.ok) throw new Error(result.error.message);
      return {
        manager_id: managerId,
        accuracy_percent: result.data.avg_accuracy,
        periods: result.data.periods,
        calculated_at: _time.now(),
      };
    });
  }

  async generateForecast(managerId: number | null, period: string | null) {
    const pipelineR = await this.repo.getPipelineForecast();
    if (!pipelineR.ok) return pipelineR;
    const pipeline = pipelineR.data as Record<string, unknown>;
    return safeCall(async () => ({
      manager_id: managerId,
      period: period ?? 'monthly',
      forecast_revenue: Number(pipeline['pipeline_value'] ?? 0) * FORECAST.pipeline_conversion,
      pipeline_value: pipeline['pipeline_value'] ?? 0,
      deal_count: pipeline['deal_count'] ?? 0,
      confidence: FORECAST_CONFIDENCE_DEFAULT,
      generated_at: _time.now(),
    }));
  }

  async getForecastHistory(managerId: number | null, lim: number) {
    return safeCall(async () => {
      const r = await this.repo.getForecastHistory(managerId, lim);
      const history = r.ok ? r.data : [];
      return { manager_id: managerId, history, limit: lim };
    });
  }

  async getLeaderboard(period: string | null, limit: number) {
    return safeCall(async () => {
      const leaderboard = await this.repo.getLeaderboard(limit);
      return { leaderboard, period: period ?? 'monthly' };
    });
  }

  async listSalesOrders(lim: number, off: number) {
    return this.repo.listSalesOrders(lim, off);
  }
}
