/**
 * @module get-work-centers-stats.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, Err } from '@common/result';
import { DrizzleWorkCenterRepository, WorkCenterStats } from '../../infrastructure/repositories/drizzle-work-center.repo';
import { GetWorkCentersStatsQuery } from './get-work-centers-stats.query';

@Injectable()
@QueryHandler(GetWorkCentersStatsQuery)
export class GetWorkCentersStatsHandler implements IQueryHandler<GetWorkCentersStatsQuery> {
  private readonly logger = new Logger(GetWorkCentersStatsHandler.name);

  constructor(
    @Inject('IWorkCenterRepository')
    private readonly workCenterRepo: DrizzleWorkCenterRepository,
  ) {}

  async execute(query: GetWorkCentersStatsQuery): Promise<Result<WorkCenterStats>> {
      const result = await this.workCenterRepo.getStats();
      if (!result.ok) {
        this.logger.warn(`Failed to fetch stats: ${result.error}`);
        return Err(result.error);
      }

      this.logger.log(`Work center stats fetched: total=${result.data?.total}`);
      return { ok: true, data: result.data };
  }
}
