/**
 * @module director-data.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Result } from '@common/result';
import { DirectorDataRepository } from './director-data.repository';
import type { DashboardData, SummaryData, ProductionData, HrData, FinanceData, AlertsData, AiSummaryData } from './director-data.repository';

@Injectable()
export class DirectorDataService {
  constructor(private readonly repo: DirectorDataRepository) {}

  async getDashboard(): Promise<Result<DashboardData>> {
    return this.repo.queryDashboard();
  }

  async getSummaryFull(): Promise<Result<SummaryData>> {
    return this.repo.querySummary();
  }

  async getProductionFull(): Promise<Result<ProductionData>> {
    return this.repo.queryProduction();
  }

  async getHrFull(): Promise<Result<HrData>> {
    return this.repo.queryHr();
  }

  async getFinanceFull(): Promise<Result<FinanceData>> {
    return this.repo.queryFinance();
  }

  async getAlerts(): Promise<Result<AlertsData>> {
    const r = await this.repo.queryAlerts();
    if (!r.ok) return Ok({ alerts: [], count: 0 });
    return r;
  }

  async getAiSummary(): Promise<Result<AiSummaryData>> {
    return this.repo.queryAiSummary();
  }

  markVip(_orderId: number): Result<{ marked: boolean }> {
    return Ok({ marked: true });
  }
}
