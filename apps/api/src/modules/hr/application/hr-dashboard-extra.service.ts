/**
 * @module hr-dashboard-extra.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { HR_DASHBOARD_EXTRA_REPO, type IHrDashboardExtraRepo } from '../domain/repositories/i-hr-dashboard-extra.repo';

@Injectable()
export class HrDashboardExtraService {
  constructor(@Inject(HR_DASHBOARD_EXTRA_REPO) private readonly repo: IHrDashboardExtraRepo) {}

  async getResignationStats(): Promise<Result<object, AppError>> {
    return this.repo.getResignationStats();
  }

  async getRiskScores() {
    return this.repo.getRiskScores();
  }

  async getSafetySummary() {
    return this.repo.getSafetySummary();
  }

  async getSafetyIncidents() {
    return this.repo.getSafetyIncidents();
  }

  async getOffboardingStats() {
    return this.repo.getOffboardingStats();
  }

  async getContractsExpiring(days: number) {
    return this.repo.getContractsExpiring(days);
  }
}
