import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { PosReportsRepository } from '../repositories/pos-reports.repository';

@Injectable()
export class PosReportsService {
  constructor(private readonly repo: PosReportsRepository) {}

  async getKpi(): Promise<Result<object, AppError>> {
    return this.repo.getKpi();
  }

  async getStockReport(warehouseId?: string, category?: string) {
    return this.repo.getStockReport(warehouseId, category);
  }

  async getMovementStats(period: 'day' | 'week' | 'month') {
    return safeCall(() => {
      const intervals: Record<string, string> = { day: '24 hours', week: '7 days', month: '30 days' };
      const interval = intervals[period] ?? '30 days';
      return this.repo.getMovementStats(interval);
    });
  }

  async getTopMaterials() {
    return this.repo.getTopMaterials();
  }

  async getThreeWayMismatch() {
    return this.repo.getThreeWayMismatch();
  }

  async getLiabilityReport() {
    return this.repo.getLiabilityReport();
  }
}
