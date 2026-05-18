/**
 * @module get-routings.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db, routings } from '@shared/db';
import { sql, desc } from 'drizzle-orm';
import { Result, PaginatedResult } from '@common/types/result.type';
import { GetRoutingsQuery } from './get-routings.query';

@Injectable()
@QueryHandler(GetRoutingsQuery)
export class GetRoutingsHandler implements IQueryHandler<GetRoutingsQuery> {
  private readonly logger = new Logger(GetRoutingsHandler.name);

  async execute(query: GetRoutingsQuery): Promise<Result<PaginatedResult<Record<string, unknown>>>> {
      const page = query.filters.page || 1;
      const limit = query.filters.limit || 10;
      const offset = (page - 1) * limit;

      const total = await db.select({ count: sql<number>`count(*)` }).from(routings);

      const items = await db.select().from(routings).orderBy(desc(routings.created_at)).limit(limit).offset(offset);

      const paginatedResult: PaginatedResult<Record<string, unknown>> = {
        items,
        total: parseInt(String(total[0]?.count || '0'), 10),
        page,
        limit,
      };

      this.logger.debug(`Routings fetched: page=${page}, limit=${limit}, total=${paginatedResult.total}`);

      return { ok: true, data: paginatedResult };
  }
}
