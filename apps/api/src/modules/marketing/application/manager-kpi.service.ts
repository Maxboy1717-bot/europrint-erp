/**
 * @module manager-kpi.service
 * @description Business-logic service for the sales-manager KPI karta
 *   (vision 14-90). Transport-agnostic; delegates data access to the repo
 *   and returns Result<T> from @common/result.
 */

import { Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import {
  DrizzleManagerKpiRepository,
  ManagerKpiRow,
} from '../infrastructure/repositories/drizzle-manager-kpi.repo';

@Injectable()
export class ManagerKpiService {
  constructor(private readonly repo: DrizzleManagerKpiRepository) {}

  getManagerKpi(opts: { managerId?: number }): Promise<Result<ManagerKpiRow[]>> {
    return this.repo.getManagerKpi(opts);
  }
}
