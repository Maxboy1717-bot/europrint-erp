/**
 * @module get-defect-stats.handler
 * @description CQRS query handler: aggregate stats from qc_defects.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { GetDefectStatsQuery } from './get-defect-stats.query';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> =>
  (await runQuery<Row>(q)).rows as Row[];

@Injectable()
@QueryHandler(GetDefectStatsQuery)
export class GetDefectStatsHandler implements IQueryHandler<GetDefectStatsQuery> {
  private readonly logger = new Logger(GetDefectStatsHandler.name);

  async execute(_query: GetDefectStatsQuery): Promise<{ ok: boolean; data: Row }> {
    const rows = await exec(sql`
      SELECT
        COUNT(*)::int                                                       AS total,
        COUNT(*) FILTER (WHERE status = 'open')::int                       AS open_count,
        COUNT(*) FILTER (WHERE status = 'resolved')::int                   AS resolved_count,
        COUNT(*) FILTER (WHERE status = 'closed')::int                     AS closed_count,
        COUNT(*) FILTER (WHERE severity = 'critical')::int                 AS critical_count,
        COUNT(*) FILTER (WHERE severity = 'major')::int                    AS major_count,
        COUNT(*) FILTER (WHERE severity = 'minor')::int                    AS minor_count,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS last_30_days
      FROM qc_defects
    `);
    this.logger.log('Defect stats retrieved');
    return { ok: true, data: rows[0] ?? {} };
  }
}
