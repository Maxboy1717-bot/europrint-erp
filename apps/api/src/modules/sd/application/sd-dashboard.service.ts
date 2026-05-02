import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { SdDashboardRepository } from './sd-dashboard.repository';

@Injectable()
export class SdDashboardService {
  constructor(private readonly repo: SdDashboardRepository) {}

  async getOverview(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const [stats, top_customers] = await Promise.all([
        this.repo.getOverview(),
        this.repo.getTopCustomers(),
      ]);
      return { stats, top_customers };
    });
  }

  async getManagerActions(mid: number | null, lim: number) {
    return safeCall(async () => {
      const [pendingAdvR, techChkR] = await Promise.all([
        this.repo.getPendingAdvanceOrders(mid, lim),
        this.repo.getPendingTechCheckpoints(mid, lim),
      ]);
      const pending_advance = pendingAdvR.ok ? pendingAdvR.data : [];
      const tech_checkpoints = techChkR.ok ? techChkR.data : [];
      return { pending_advance, tech_checkpoints, total: pending_advance.length + tech_checkpoints.length };
    });
  }

  async getQuotaStats(mid: number | null) {
    return this.repo.getQuotaStats(mid);
  }
}
