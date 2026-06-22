/**
 * @module get-inspection-stats.handler
 * @description CQRS query handler — QC quality KPI panel (EP-QC-077 "Sifat KPI va
 *   statistikasi" · EP-QC-018 sifat trendi · EP-QC-084 plan vs fakt brak%).
 *
 *   Computes the documented quality panel metrics from the canonical
 *   `qc_inspections` table (NOT `quality_defects_camera` — that camera-defect
 *   table is a different feature and held this query at all-zero / "yashil
 *   lekin noto'g'ri", Q-40). Metrics per docs/audit/decisions/09-qc.md:
 *     • brak %      = items_failed ÷ items_checked          (EP-QC-084: brak ÷ plan)
 *     • pass rate   = items_passed ÷ items_checked
 *     • FTQ %       = inspections passed on first submit ÷ total inspections
 *   "Boshlanish uchun oddiy brak % yetadi" (EP-QC-018) — sigma/DPMO is a
 *   separate owner-gated concern (see DpmoService); this handler stays at the
 *   documented brak%/FTQ level and never invents a norm threshold (≤2% anomaly
 *   flag is owner-gated per operation type, EP-QC-084 — NOT computed here).
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { PERCENT_BASIS } from '@common/constants/app.constants';
import { Injectable, Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { safeNum, safeDiv } from '@common/math/math-utils';
import { GetInspectionStatsQuery } from './get-inspection-stats.query';

type StatsResponse = {
  ok: boolean;
  data: {
    total_inspections: number;
    total_checked: number;
    total_passed: number;
    total_failed: number;
    pass_rate: number;
    fail_rate: number;
    brak_percent: number;
    ftq_percent: number;
  };
};

type StatsRow = {
  total_inspections: number | string;
  total_checked: number | string;
  total_passed: number | string;
  total_failed: number | string;
  first_pass_count: number | string;
};

const exec = async (q: SQL | SQLWrapper): Promise<Record<string, unknown>[]> =>
  (await runQuery<Record<string, unknown>>(q)).rows;

/** Round a 0..1 ratio to a percent with two decimals (PERCENT_BASIS=10000). */
const toPercent = (ratio: number): number =>
  Math.round(ratio * PERCENT_BASIS) / 100;

@Injectable()
@QueryHandler(GetInspectionStatsQuery)
export class GetInspectionStatsHandler
  implements IQueryHandler<GetInspectionStatsQuery, StatsResponse>
{
  private readonly logger = new Logger(GetInspectionStatsHandler.name);

  async execute(query: GetInspectionStatsQuery): Promise<StatsResponse> {
    // Optional [from, to] window on inspected_at (falls back to created_at).
    const fromClause = query.fromDate
      ? sql`AND COALESCE(inspected_at, created_at) >= ${query.fromDate.toISOString()}`
      : sql``;
    const toClause = query.toDate
      ? sql`AND COALESCE(inspected_at, created_at) <= ${query.toDate.toISOString()}`
      : sql``;

    const rows = await exec(sql`
      SELECT
        COUNT(*)::int                                   AS total_inspections,
        COALESCE(SUM(items_checked), 0)::int            AS total_checked,
        COALESCE(SUM(items_passed),  0)::int            AS total_passed,
        COALESCE(SUM(items_failed),  0)::int            AS total_failed,
        COUNT(*) FILTER (
          WHERE LOWER(COALESCE(result, status, '')) IN ('passed', 'pass', 'qabul')
        )::int                                          AS first_pass_count
      FROM qc_inspections
      WHERE 1 = 1
        ${fromClause}
        ${toClause}
    `);

    const row = (rows[0] ?? {}) as Partial<StatsRow>;
    const totalInspections = safeNum(row.total_inspections ?? 0);
    const totalChecked = safeNum(row.total_checked ?? 0);
    const totalPassed = safeNum(row.total_passed ?? 0);
    const totalFailed = safeNum(row.total_failed ?? 0);
    const firstPassCount = safeNum(row.first_pass_count ?? 0);

    // EP-QC-084: brak% = brak ÷ plan (here plan = items_checked).
    const brakPercent = toPercent(safeDiv(totalFailed, totalChecked));
    const passRate = toPercent(safeDiv(totalPassed, totalChecked));
    // FTQ: share of inspections that passed on submission (EP-QC-077).
    const ftqPercent = toPercent(safeDiv(firstPassCount, totalInspections));

    this.logger.log(
      `code=EP-QC-077 QC quality KPI: inspections=${totalInspections} checked=${totalChecked} brak%=${brakPercent} ftq%=${ftqPercent}`,
    );

    return {
      ok: true,
      data: {
        total_inspections: totalInspections,
        total_checked: totalChecked,
        total_passed: totalPassed,
        total_failed: totalFailed,
        pass_rate: passRate,
        fail_rate: brakPercent,
        brak_percent: brakPercent,
        ftq_percent: ftqPercent,
      },
    };
  }
}
