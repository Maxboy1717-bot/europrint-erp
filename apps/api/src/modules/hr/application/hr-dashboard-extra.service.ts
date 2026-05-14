/**
 * @module hr-dashboard-extra.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { HrDashboardExtraRepository } from './hr-dashboard-extra.repository';

@Injectable()
export class HrDashboardExtraService {
  constructor(private readonly repo: HrDashboardExtraRepository) {}

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
