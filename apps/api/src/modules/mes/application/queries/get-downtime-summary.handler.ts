/**
 * @module get-downtime-summary.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, Err } from '@common/result';
import { DowntimeSummary } from '../../infrastructure/repositories/drizzle-downtime.repo';
import { DrizzleDowntimeRepository } from '../../infrastructure/repositories/drizzle-downtime.repo';
import { DOWNTIME_REPO } from '../../domain/repositories/mes.repository';
import { GetDowntimeSummaryQuery } from './get-downtime-summary.query';

@Injectable()
@QueryHandler(GetDowntimeSummaryQuery)
export class GetDowntimeSummaryHandler implements IQueryHandler<GetDowntimeSummaryQuery> {
  private readonly logger = new Logger(GetDowntimeSummaryHandler.name);

  constructor(
    @Inject(DOWNTIME_REPO)
    private readonly downtimeRepo: DrizzleDowntimeRepository,
  ) {}

  async execute(query: GetDowntimeSummaryQuery): Promise<Result<DowntimeSummary>> {
      this.logger.debug(
        `Fetching downtime summary: from=${query.from}, to=${query.to}`,
      );

      const result = await this.downtimeRepo.getDowntimeSummary(query.from, query.to);
      if (!result.ok) {
        this.logger.warn(`Failed to fetch summary: ${result.error}`);
        return Err(result.error);
      }

      this.logger.log(
        `Downtime summary fetched: totalHours=${result.data?.totalDowntimeHours}`,
      );
      return { ok: true, data: result.data };
  }
}
