/**
 * @module get-work-centers.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, Err } from '@common/result';
import { WorkCenter } from '../../domain/aggregates/work-center.aggregate';
import { DrizzleWorkCenterRepository } from '../../infrastructure/repositories/drizzle-work-center.repo';
import { GetWorkCentersQuery } from './get-work-centers.query';

@Injectable()
@QueryHandler(GetWorkCentersQuery)
export class GetWorkCentersHandler implements IQueryHandler<GetWorkCentersQuery> {
  private readonly logger = new Logger(GetWorkCentersHandler.name);

  constructor(
    @Inject('IWorkCenterRepository')
    private readonly workCenterRepo: DrizzleWorkCenterRepository,
  ) {}

  async execute(query: GetWorkCentersQuery): Promise<Result<WorkCenter[]>> {
      this.logger.debug(`Fetching work centers with filters: ${JSON.stringify(query.filters)}`);

      const result = await this.workCenterRepo.findAll(query.filters);
      if (!result.ok) {
        this.logger.warn(`Failed to fetch work centers: ${result.error}`);
        return Err(result.error);
      }

      this.logger.log(`Work centers fetched: ${result.data?.length || 0}`);
      return { ok: true, data: result.data };
  }
}
