/**
 * @module get-inspection-stats.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { PERCENT_BASIS } from '@common/constants/app.constants';
import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { GetInspectionStatsQuery } from './get-inspection-stats.query';

type StatsResponse = { ok: boolean; data: { total_inspections: number; total_checked: number; total_passed: number; total_failed: number; pass_rate: number; fail_rate: number } };
type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
@QueryHandler(GetInspectionStatsQuery)
export class GetInspectionStatsHandler implements IQueryHandler<GetInspectionStatsQuery, StatsResponse> {
  private readonly logger = new Logger(GetInspectionStatsHandler.name);

  async execute(_query: GetInspectionStatsQuery): Promise<StatsResponse> {
    const r = await exec(sql`SELECT COUNT(*)::int AS total_inspections, COUNT(*) FILTER (WHERE is_resolved = true)::int AS total_resolved, COUNT(*) FILTER (WHERE is_resolved = false)::int AS total_open FROM quality_defects_camera`);
    const row = r[0] ?? {};
    const total = Number(row.total_inspections) || 0;
    const resolved = Number(row.total_resolved) || 0;
    const open = Number(row.total_open) || 0;
    this.logger.log('Inspection stats retrieved');
    return { ok: true, data: { total_inspections: total, total_checked: total, total_passed: resolved, total_failed: open, pass_rate: total > 0 ? Math.round((resolved / total) * PERCENT_BASIS) / 100 : 0, fail_rate: total > 0 ? Math.round((open / total) * PERCENT_BASIS) / 100 : 0 } };
  }
}
