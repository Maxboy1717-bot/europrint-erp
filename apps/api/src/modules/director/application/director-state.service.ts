/**
 * @module director-state.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Inject, Injectable } from '@nestjs/common';
import { Ok, Result } from '@common/result';
import {
  DIRECTOR_STATE_REPO,
  type IDirectorStateRepo,
  type WmsRentalData,
  type CompanyStateHistoryData,
  type IdealVsActualData,
} from '../domain/repositories/i-director-state.repo';

@Injectable()
export class DirectorStateService {
  constructor(@Inject(DIRECTOR_STATE_REPO) private readonly repo: IDirectorStateRepo) {}

  async getWmsRental(): Promise<Result<WmsRentalData>> {
    const r = await this.repo.queryWmsRental();
    if (!r.ok) {
      const now = _time.now();
      return Ok({ rentalData: [], grandTotal: 0, grandTotalToDate: 0, daysElapsed: now.getDate(), daysInMonth: 30, month: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`, generatedAt: now.toISOString() });
    }
    return r;
  }

  async getCompanyStateHistory(): Promise<Result<CompanyStateHistoryData>> {
    const r = await this.repo.queryCompanyStateHistory();
    if (!r.ok) return Ok({ history: [] });
    return r;
  }

  async getCurrentCompanyState(): Promise<Result<{
    state_key: string;
    week_start: string;
    perf_ratio: number;
    profit_pct: number;
    revenue_pct: number;
  }>> {
    const historyResult = await this.repo.queryCompanyStateHistory();
    const history = historyResult.ok ? historyResult.data.history : [];
    const latest = history[0];
    if (!latest) {
      return Ok({ state_key: 'NORMAL', week_start: _time.now().toISOString(), perf_ratio: 0, profit_pct: 0, revenue_pct: 0 });
    }
    const profit_pct = latest.revenue > 0 ? Math.round((latest.profit / latest.revenue) * 100) : 0;
    const prev = history[1];
    const revenue_pct = prev && prev.revenue > 0 ? Math.round(((latest.revenue - prev.revenue) / prev.revenue) * 100) : 0;
    return Ok({ state_key: latest.state_key, week_start: latest.week_start, perf_ratio: latest.perf_ratio, profit_pct, revenue_pct });
  }

  async getIdealVsActual(): Promise<Result<IdealVsActualData>> {
    return this.repo.queryIdealVsActual();
  }

  async markOrderVip(orderId: number): Promise<Result<void>> {
    return this.repo.executeMarkVip(orderId);
  }
}
