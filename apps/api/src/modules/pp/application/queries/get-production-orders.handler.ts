import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { db, production_orders } from '@shared/db';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { Result, PaginatedResult } from '@common/types/result.type';
import { GetProductionOrdersQuery } from './get-production-orders.query';

@Injectable()
@QueryHandler(GetProductionOrdersQuery)
export class GetProductionOrdersHandler implements IQueryHandler<GetProductionOrdersQuery> {
  private readonly logger = new Logger(GetProductionOrdersHandler.name);

  async execute(query: GetProductionOrdersQuery): Promise<Result<PaginatedResult<Record<string, unknown>>>> {
      const page = query.filters.page || 1;
      const limit = query.filters.limit || 10;
      const offset = (page - 1) * limit;

      const conditions: import('drizzle-orm').SQL<unknown>[] = [];

      if (query.filters.status) {
        conditions.push(sql`${production_orders.status} = ${String(query.filters.status)}`);
      }

      if (query.filters.salesOrderId) {
        conditions.push(sql`${production_orders.sales_order_id} = ${query.filters.salesOrderId}`);
      }

      if (query.filters.from) {
        conditions.push(sql`${production_orders.scheduled_start} >= ${query.filters.from}`);
      }

      if (query.filters.to) {
        conditions.push(sql`${production_orders.scheduled_end} <= ${query.filters.to}`);
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(production_orders)
        .where(where);

      const items = await db.select().from(production_orders).where(where).orderBy(desc(production_orders.created_at)).limit(limit).offset(offset);

      const paginatedResult: PaginatedResult<Record<string, unknown>> = {
        items,
        total: parseInt(String(total[0]?.count || '0'), 10),
        page,
        limit,
      };

      this.logger.debug(`Production orders fetched: page=${page}, limit=${limit}, total=${paginatedResult.total}`);

      return { ok: true, data: paginatedResult };
  }
}
