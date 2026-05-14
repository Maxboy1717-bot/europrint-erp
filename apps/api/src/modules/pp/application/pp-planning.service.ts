/**
 * @module pp-planning.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { PpPlanningRepository } from './pp-planning.repository';

@Injectable()
export class PpPlanningService {
  constructor(private readonly repo: PpPlanningRepository) {}

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
