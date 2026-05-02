import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { Ok, Result } from '@common/result';
import { DirectorStateRepository } from './director-state.repository';
import type { WmsRentalData, CompanyStateHistoryData, IdealVsActualData } from './director-state.repository';

@Injectable()
export class DirectorStateService {
  constructor(private readonly repo: DirectorStateRepository) {}

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

  async getIdealVsActual(): Promise<Result<IdealVsActualData>> {
    return this.repo.queryIdealVsActual();
  }

  async markOrderVip(orderId: number): Promise<Result<void>> {
    return this.repo.executeMarkVip(orderId);
  }
}
