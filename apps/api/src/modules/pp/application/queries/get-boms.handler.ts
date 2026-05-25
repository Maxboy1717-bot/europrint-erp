/**
 * @module get-boms.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { PaginatedResult } from '@common/types/result.type';
import { GetBomsQuery } from './get-boms.query';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
@QueryHandler(GetBomsQuery)
export class GetBomsHandler implements IQueryHandler<GetBomsQuery> {
  private readonly logger = new Logger(GetBomsHandler.name);

  async execute(query: GetBomsQuery): Promise<PaginatedResult<Row>> {
    const page = query.filters.page || 1; const limit = query.filters.limit || 10; const offset = (page - 1) * limit;
    const [countRows, items] = await Promise.all([
      exec(sql`SELECT COUNT(*)::int AS count FROM bom_headers`),
      exec(sql`SELECT bh.*, mc.xom_ashyo AS product_name FROM bom_headers bh LEFT JOIN material_cards mc ON bh.product_id = mc.id ORDER BY bh.created_at DESC LIMIT ${limit} OFFSET ${offset}`),
    ]);
    const rawTotal = Number(countRows[0]?.count ?? 0);
    const total = Number.isFinite(rawTotal) ? rawTotal : 0;
    this.logger.debug(`BOMs fetched: page=${page}, limit=${limit}, total=${total}`);
    return { items, total, page, limit };
  }
}
