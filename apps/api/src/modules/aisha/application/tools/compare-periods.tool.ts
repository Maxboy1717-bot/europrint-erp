/**
 * @module compare-periods.tool
 */

// RULE4_EXCEPTION: AIsha tools intentionally use raw SQL. Each tool
// aggregates across cross-module tables (sales, production, HR, finance,
// security, IoT, kanban, calendar) that the AIsha module does not own.
// Importing every Drizzle schema would create tight coupling between
// AIsha and every other domain module. The read-only / single-INSERT
// raw SQL keeps AIsha a loose query-adapter layer over the ERP. Drizzle
// ORM is used elsewhere; see [[aisha-final-report]] for the
// architectural rationale.

import { Injectable } from '@nestjs/common';
import { Result, Err, AppErr, safeCall } from '@common/result';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult, rowsOf } from './_helpers';

export interface PeriodComparison {
  metric:     string;
  period1Sum: number;
  period2Sum: number;
  changePct:  number;
  significant: boolean;
}

const ALLOWED: Record<string, { table: string; column: string }> = {
  revenue:    { table: 'sales_orders',      column: 'total' },
  production: { table: 'production_orders', column: 'qty_produced' },
  defects:    { table: 'qc_inspections',    column: 'id' },
};

@Injectable()
export class ComparePeriodsTool implements IAishaTool {
  readonly definition = {
    name: 'compare_periods',
    description: 'Ikkita davrni solishtirish: revenue / production / defects.',
    input_schema: {
      type: 'object' as const,
      properties: {
        metric:  { type: 'string', description: 'revenue | production | defects' },
        period1: { type: 'string', description: 'YYYY-MM-DD..YYYY-MM-DD' },
        period2: { type: 'string', description: 'YYYY-MM-DD..YYYY-MM-DD' },
      },
      required: ['metric', 'period1', 'period2'],
    },
  };

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<PeriodComparison>>> {
    const metric = String(input['metric'] ?? '');
    const meta = ALLOWED[metric];
    if (!meta) return Err(AppErr('VALIDATION', `Noma'lum metric: ${metric}`));
    const p1 = String(input['period1'] ?? '').split('..');
    const p2 = String(input['period2'] ?? '').split('..');
    if (p1.length !== 2 || p2.length !== 2) return Err(AppErr('VALIDATION', 'period format: YYYY-MM-DD..YYYY-MM-DD'));

    return safeCall<ToolResult<PeriodComparison>>(async () => {
      const start = Date.now();
      const agg = metric === 'defects' ? 'COUNT(*)::int' : `COALESCE(SUM(${meta.column}),0)::float`;
      const q1 = await db.execute(sql.raw(`SELECT ${agg} AS s FROM ${meta.table} WHERE created_at BETWEEN '${p1[0]}' AND '${p1[1]}'`));
      const q2 = await db.execute(sql.raw(`SELECT ${agg} AS s FROM ${meta.table} WHERE created_at BETWEEN '${p2[0]}' AND '${p2[1]}'`));
      const v1 = rowsOf<{ s: number }>(q1)[0]?.s ?? 0;
      const v2 = rowsOf<{ s: number }>(q2)[0]?.s ?? 0;
      const change = v1 === 0 ? (v2 > 0 ? 100 : 0) : ((v2 - v1) / v1) * 100;

      return provResult<PeriodComparison>({
        data: {
          metric,
          period1Sum: v1, period2Sum: v2,
          changePct: Number(change.toFixed(2)),
          significant: Math.abs(change) > 10,
        },
        sources: [provSource({ type: 'database', identifier: `${meta.table}`, startMs: start, rowCount: 2 })],
        citations: [{ label: metric }],
      });
    });
  }
}
