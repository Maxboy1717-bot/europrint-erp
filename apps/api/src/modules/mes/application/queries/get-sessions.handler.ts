import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, PaginatedResult } from '@common/types/result.type';
import { GetSessionsQuery } from './get-sessions.query';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
@QueryHandler(GetSessionsQuery)
export class GetSessionsHandler implements IQueryHandler<GetSessionsQuery> {
  private readonly logger = new Logger(GetSessionsHandler.name);

  async execute(query: GetSessionsQuery): Promise<Result<PaginatedResult<Row>>> {
    const page = query.filters.page || 1; const limit = query.filters.limit || 10; const offset = (page - 1) * limit;
    const [countRows, items] = await Promise.all([
      exec(sql`SELECT COUNT(*)::int AS count FROM production_sessions`),
      exec(sql`SELECT * FROM production_sessions ORDER BY started_at DESC NULLS LAST LIMIT ${limit} OFFSET ${offset}`),
    ]);
    const total = Number(countRows[0]?.count ?? 0);
    this.logger.debug(`MES sessions fetched: page=${page}, limit=${limit}, total=${total}`);
    return { ok: true, data: { items, total, page, limit } };
  }
}
