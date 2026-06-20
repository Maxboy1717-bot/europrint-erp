/**
 * @module director-data.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { Ok, Result } from '@common/result';
import {
  DIRECTOR_DATA_REPO,
  type IDirectorDataRepo,
  type DashboardData,
  type SummaryData,
  type ProductionData,
  type HrData,
  type FinanceData,
  type AlertsData,
  type AiSummaryData,
} from '../domain/repositories/i-director-data.repo';

@Injectable()
export class DirectorDataService {
  constructor(@Inject(DIRECTOR_DATA_REPO) private readonly repo: IDirectorDataRepo) {}

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

}
