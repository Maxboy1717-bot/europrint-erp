/**
 * @module sd-dashboard.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Inject } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { ISdDashboardRepo, SD_DASHBOARD_REPO } from '../domain/repositories/i-sd-dashboard.repo';

@Injectable()
export class SdDashboardService {
  constructor(@Inject(SD_DASHBOARD_REPO) private readonly repo: ISdDashboardRepo) {}

  async getOverview(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const [statsRes, customersRes] = await Promise.all([
        this.repo.getOverview(),
        this.repo.getTopCustomers(),
      ]);
      return {
        stats: statsRes.ok ? statsRes.data : {},
        top_customers: customersRes.ok ? customersRes.data : [],
      };
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
