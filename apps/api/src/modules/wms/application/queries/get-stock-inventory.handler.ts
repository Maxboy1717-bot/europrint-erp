/**
 * @module get-stock-inventory.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { Result } from '@common/result';
import { GetStockInventoryQuery } from './get-stock-inventory.query';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
@QueryHandler(GetStockInventoryQuery)
export class GetStockInventoryHandler implements IQueryHandler<GetStockInventoryQuery> {
  private readonly logger = new Logger(GetStockInventoryHandler.name);

  async execute(query: GetStockInventoryQuery): Promise<Result<{ items: unknown[]; total: number }>> {
    const page = query.filters?.page || 1;
    const limit = query.filters?.limit || 10;
    const offset = (page - 1) * limit;
    this.logger.debug(`Fetching stock inventory with filters: ${JSON.stringify(query.filters)}`);
    const [countRows, items] = await Promise.all([
      exec(sql`SELECT COUNT(*)::int AS count FROM warehouse_stock`),
      exec(sql`SELECT ws.*, mc.xom_ashyo AS material_name, mc.unit_of_measure, w.name AS warehouse_name FROM warehouse_stock ws LEFT JOIN material_cards mc ON ws.material_id = mc.id LEFT JOIN warehouses w ON ws.warehouse_id = w.id ORDER BY ws.created_at DESC LIMIT ${limit} OFFSET ${offset}`),
    ]);
    this.logger.log(`Stock items fetched: ${items.length}, total: ${countRows[0]?.count}`);
    return { ok: true, data: { items, total: Number(countRows[0]?.count ?? 0) } };
  }
}
