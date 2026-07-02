/**
 * @module get-quality-metrics.tool
 */

// NOTE: (RULE4_EXCEPTION) AIsha tools intentionally use raw SQL. Each tool
// aggregates across cross-module tables (sales, production, HR, finance,
// security, IoT, kanban, calendar) that the AIsha module does not own.
// Importing every Drizzle schema would create tight coupling between
// AIsha and every other domain module. The read-only / single-INSERT
// raw SQL keeps AIsha a loose query-adapter layer over the ERP. Drizzle
// ORM is used elsewhere; see [[aisha-final-report]] for the
// architectural rationale.

import { Injectable } from '@nestjs/common';
import { Result, safeCall } from '@common/result';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult, rowsOf } from './_helpers';

export interface QualityMetrics {
  brakPercent:   number;
  openReclamations: number;
  defectsToday:  number;
}

@Injectable()
export class GetQualityMetricsTool implements IAishaTool {
  readonly definition = {
    name: 'get_quality_metrics',
    description: 'Sifat ko\'rsatkichlari: brak %, ochiq shikoyatlar, bugungi defektlar.',
    input_schema: { type: 'object' as const, properties: {} },
  };

  async execute(): Promise<Result<ToolResult<QualityMetrics>>> {
    return safeCall<ToolResult<QualityMetrics>>(async () => {
      const start = Date.now();
      const insp = rowsOf<{ p: number }>(await db.execute(sql`
        SELECT (SUM(CASE WHEN result='reject' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*),0) * 100) AS p
        FROM qc_inspections WHERE inspected_at::date = CURRENT_DATE
      `))[0]?.p ?? 0;
      // qc_reclamations.status is new/investigating/resolved/rejected (canonical
      // enum — see modules/qc/domain/aggregates/reclamation.aggregate.ts); there is
      // no literal 'open' value, so "open" here means not yet resolved/rejected.
      const recl = rowsOf<{ c: number }>(await db.execute(sql`
        SELECT COUNT(*)::int AS c FROM qc_reclamations WHERE status NOT IN ('resolved','rejected')
      `))[0]?.c ?? 0;
      const def = rowsOf<{ c: number }>(await db.execute(sql`
        SELECT COUNT(*)::int AS c FROM qc_inspections WHERE result='reject' AND inspected_at::date = CURRENT_DATE
      `))[0]?.c ?? 0;
      return provResult<QualityMetrics>({
        data: { brakPercent: insp, openReclamations: recl, defectsToday: def },
        sources: [
          provSource({ type: 'database', identifier: 'qc.inspections', startMs: start, rowCount: 2 }),
          provSource({ type: 'database', identifier: 'qc.reclamations', startMs: start, rowCount: 1 }),
        ],
      });
    });
  }
}
