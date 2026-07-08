/**
 * @module director-data.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { Ok, Result } from '@common/result';
import { TashkentTimeService } from '@common/time';
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
  type CkpDeadlineComplianceRate,
} from '../domain/repositories/i-director-data.repo';

const _time = new TashkentTimeService();

@Injectable()
export class DirectorDataService {
  constructor(@Inject(DIRECTOR_DATA_REPO) private readonly repo: IDirectorDataRepo) {}

  async getDashboard(): Promise<Result<DashboardData>> {
    return this.repo.queryDashboard();
  }

  /**
   * VISION-3340 #12: director/summary javobiga bugungi kunlik ЦКП deadline-gate
   * muvofiqlik foizi qo'shildi (ckp-gate.ts'dagi HAQIQIY `applyCkpGate` qoidasi
   * bilan hisoblangan — reimplement emas, repo orqali reuse). Gate-so'rov DB
   * xatoga uchrasa — asosiy summary BLOKLANMAYDI (fail-open faqat shu ko'rsatkich
   * uchun): ckpDeadlineCompliance = null (Q-40: soxta % o'rniga honest null).
   */
  async getSummaryFull(): Promise<Result<SummaryData>> {
    const summaryR = await this.repo.querySummary();
    if (!summaryR.ok) return summaryR;
    const today = _time.formatDate(_time.now());
    const ckpR = await this.repo.getCkpDeadlineComplianceRate(today);
    const ckpDeadlineCompliance: CkpDeadlineComplianceRate | null = ckpR.ok ? ckpR.data : null;
    return Ok({ ...summaryR.data, ckpDeadlineCompliance });
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
