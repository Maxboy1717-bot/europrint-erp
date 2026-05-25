/**
 * @module get-downtime.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, Err } from '@common/result';
import { DowntimeEvent } from '../../domain/aggregates/downtime-event.aggregate';
import { DrizzleDowntimeRepository } from '../../infrastructure/repositories/drizzle-downtime.repo';
import { DOWNTIME_REPO } from '../../domain/repositories/mes.repository';
import { GetDowntimeQuery } from './get-downtime.query';

@Injectable()
@QueryHandler(GetDowntimeQuery)
export class GetDowntimeHandler implements IQueryHandler<GetDowntimeQuery> {
  private readonly logger = new Logger(GetDowntimeHandler.name);

  constructor(
    @Inject(DOWNTIME_REPO)
    private readonly downtimeRepo: DrizzleDowntimeRepository,
  ) {}

  async execute(query: GetDowntimeQuery): Promise<Result<{ items: DowntimeEvent[]; total: number }>> {
      this.logger.debug(`Fetching downtime events with filters: ${JSON.stringify(query.filters)}`);

      const result = await this.downtimeRepo.findAll(query.filters);
      if (!result.ok) {
        this.logger.warn(`Failed to fetch downtime events: ${result.error}`);
        return Err(result.error);
      }

      this.logger.log(`Downtime events fetched: ${result.data?.items.length || 0}`);
      return { ok: true, data: result.data };
  }
}
