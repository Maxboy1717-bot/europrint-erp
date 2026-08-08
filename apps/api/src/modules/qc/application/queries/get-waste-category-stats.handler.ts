/**
 * @module get-waste-category-stats.handler
 * @description CQRS query handler: aggregate setup (priladka) vs production brak from qc_defects.
 * Vision 09-qc#96 — "Priladka braki alohida hisoblansin".
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { GetWasteCategoryStatsQuery } from './get-waste-category-stats.query';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> =>
  (await runQuery<Row>(q)).rows as Row[];

@Injectable()
@QueryHandler(GetWasteCategoryStatsQuery)
export class GetWasteCategoryStatsHandler implements IQueryHandler<GetWasteCategoryStatsQuery> {
  private readonly logger = new Logger(GetWasteCategoryStatsHandler.name);

  async execute(_query: GetWasteCategoryStatsQuery): Promise<{ ok: boolean; data: Row }> {
    const rows = await exec(sql`
      SELECT
        COUNT(*)::int                                                                     AS total,
        COUNT(*) FILTER (WHERE waste_category = 'setup')::int                             AS setup_count,
        COUNT(*) FILTER (WHERE waste_category = 'production')::int                        AS production_count,
        COALESCE(SUM(quantity) FILTER (WHERE waste_category = 'setup'), 0)::numeric       AS setup_quantity,
        COALESCE(SUM(quantity) FILTER (WHERE waste_category = 'production'), 0)::numeric  AS production_quantity,
        ROUND(
          COUNT(*) FILTER (WHERE waste_category = 'setup')::numeric
          / NULLIF(COUNT(*), 0) * 100, 2
        )                                                                                 AS setup_ratio_percent
      FROM qc_defects
    `);
    this.logger.log('Waste-category (setup vs production) stats retrieved');
    return { ok: true, data: rows[0] ?? {} };
  }
}
