/**
 * @module get-low-stock.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db, stock_items } from '@shared/db';
import { lt, asc, sql } from 'drizzle-orm';
import { Result } from '@common/result';
import { GetLowStockQuery } from './get-low-stock.query';

@Injectable()
@QueryHandler(GetLowStockQuery)
export class GetLowStockHandler implements IQueryHandler<GetLowStockQuery> {
  private readonly logger = new Logger(GetLowStockHandler.name);

  async execute(query: GetLowStockQuery): Promise<Result<object[]>> {
      const threshold = query.threshold || 10;
      this.logger.debug(`Fetching low stock items with threshold: ${threshold}`);

      const items = await db.select().from(stock_items)
        .where(sql`${stock_items.quantity} < ${threshold}`)
        .orderBy(asc(stock_items.quantity));

      this.logger.log(`Low stock items fetched: ${items.length}`);
      return { ok: true, data: items };
  }
}
