/**
 * @module pp-planning.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { PP_PLANNING_REPO, type IPpPlanningRepo } from '../domain/repositories/i-pp-planning.repo';

@Injectable()
export class PpPlanningService {
  constructor(@Inject(PP_PLANNING_REPO) private readonly repo: IPpPlanningRepo) {}

  async getSchedule(start: string, end: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      return this.repo.getSchedule(start, end);
    });
  }

  async createScheduleEntry(body: Record<string, unknown>) {
    return safeCall(async () => {
      return this.repo.createScheduleEntry(body);
    });
  }

  async updateOperation(id: number, body: Record<string, unknown>) {
    return safeCall(async () => {
      return this.repo.updateOperation(id, body);
    });
  }
}
