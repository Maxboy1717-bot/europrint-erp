/**
 * @module get-warehouses.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { db, warehouses } from '@shared/db';
import { eq, desc, and, sql } from 'drizzle-orm';
import { Result } from '@common/result';
import { GetWarehousesQuery } from './get-warehouses.query';

@Injectable()
@QueryHandler(GetWarehousesQuery)
export class GetWarehousesHandler implements IQueryHandler<GetWarehousesQuery> {
  private readonly logger = new Logger(GetWarehousesHandler.name);

  async execute(query: GetWarehousesQuery): Promise<Result<{ items: unknown[]; total: number }>> {
      this.logger.debug(`Fetching warehouses with filters: ${JSON.stringify(query.filters)}`);

      const conditions = [sql`deleted_at IS NULL`];

      if (query.filters?.isActive !== undefined) {
        conditions.push(eq(warehouses.is_free_storage, query.filters.isActive));
      }

      if (query.filters?.isFreeStorage !== undefined) {
        conditions.push(eq(warehouses.is_free_storage, query.filters.isFreeStorage));
      }

      const where = and(...conditions);

      const items = await db.select().from(warehouses).where(where).orderBy(desc(warehouses.created_at));

      this.logger.log(`Warehouses fetched: ${items.length}`);
      return { ok: true, data: { items, total: items.length } };
  }
}
