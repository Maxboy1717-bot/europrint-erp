/**
 * @module get-warehouses.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
// APPROVED: egasi ikki-dunyo-tuzatish 2026-07-02 — live `warehouses`.id is INTEGER
// (serial), not the uuid PK schema-wms.ts declares. schema-compat-2.ts's `warehouses`
// already has the correct integer id + the columns this query needs.
import { warehouses } from '@shared/db/schema-compat-2';
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
        conditions.push(eq(warehouses.isFreeStorage, query.filters.isActive));
      }

      if (query.filters?.isFreeStorage !== undefined) {
        conditions.push(eq(warehouses.isFreeStorage, query.filters.isFreeStorage));
      }

      const where = and(...conditions);

      // Explicit column list (not `select *`) — keeps the JSON shape identical
      // to what schema-wms.ts's uuid `warehouses` previously exposed here.
      const items = await db
        .select({
          id: warehouses.id,
          name: warehouses.name,
          address: warehouses.address,
          is_free_storage: warehouses.isFreeStorage,
          free_storage_days: warehouses.freeStorageDays,
          monthly_rate: warehouses.monthlyRate,
          deleted_at: warehouses.deletedAt,
          deleted_by: warehouses.deletedBy,
          created_at: warehouses.createdAt,
        })
        .from(warehouses)
        .where(where)
        .orderBy(desc(warehouses.createdAt));

      this.logger.log(`Warehouses fetched: ${items.length}`);
      return { ok: true, data: { items, total: items.length } };
  }
}
