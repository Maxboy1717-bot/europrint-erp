/**
 * @module generate-kpi-report.tool
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
import { Result, safeCall } from '@common/result';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult, rowsOf } from './_helpers';

export type Period = 'today' | 'week' | 'month';

export interface KpiReport {
  period:        Period;
  department:    string | null;
  pdfUrl:        string;
  metrics: {
    salesRevenue:    number;
    productionUnits: number;
    attendancePct:   number;
    defectPct:       number;
  };
}

@Injectable()
export class GenerateKpiReportTool implements IAishaTool {
  readonly definition = {
    name: 'generate_kpi_report',
    description: 'KPI hisobotini yaratish (today/week/month, ixtiyoriy bo\'lim).',
    input_schema: {
      type: 'object' as const,
      properties: {
        period:     { type: 'string', description: 'today | week | month' },
        department: { type: 'string', description: 'Bo\'lim kodi (ixtiyoriy)' },
      },
      required: ['period'],
    },
  };

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<KpiReport>>> {
    const period = (input['period'] as Period) ?? 'today';
    const dept   = (input['department'] as string | undefined) ?? null;

    return safeCall<ToolResult<KpiReport>>(async () => {
      const start = Date.now();
      const where = this.periodWhere(period);
      const rev    = rowsOf<{ s: number }>(await db.execute(sql`SELECT COALESCE(SUM(total),0)::float AS s FROM sales_orders WHERE ${sql.raw(where)}`))[0]?.s ?? 0;
      const units  = rowsOf<{ s: number }>(await db.execute(sql`SELECT COALESCE(SUM(qty_produced),0)::int AS s FROM production_orders WHERE ${sql.raw(where)}`))[0]?.s ?? 0;
      const atten  = rowsOf<{ p: number }>(await db.execute(sql`SELECT (SUM(CASE WHEN status='present' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*),0) * 100) AS p FROM hr_attendance WHERE ${sql.raw(where.replace('created_at','date'))}`))[0]?.p ?? 0;
      const defect = rowsOf<{ p: number }>(await db.execute(sql`SELECT (SUM(CASE WHEN result='reject' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*),0) * 100) AS p FROM qc_inspections WHERE ${sql.raw(where.replace('created_at','inspected_at'))}`))[0]?.p ?? 0;

      const reportId = `kpi-${period}-${Date.now()}`;
      return provResult<KpiReport>({
        data: {
          period, department: dept, pdfUrl: `/reports/kpi/${reportId}.pdf`,
          metrics: { salesRevenue: rev, productionUnits: units, attendancePct: atten, defectPct: defect },
        },
        sources: [
          provSource({ type: 'database', identifier: 'sd.sales_orders', startMs: start, rowCount: 1 }),
          provSource({ type: 'database', identifier: 'pp.production_orders', startMs: start, rowCount: 1 }),
          provSource({ type: 'database', identifier: 'hr.attendance', startMs: start, rowCount: 1 }),
          provSource({ type: 'database', identifier: 'qc.inspections', startMs: start, rowCount: 1 }),
        ],
        citations: [{ label: `KPI ${period}`, url: `/reports/kpi/${reportId}.pdf` }],
      });
    });
  }

  private periodWhere(p: Period): string {
    switch (p) {
      case 'today': return `created_at::date = CURRENT_DATE`;
      case 'week':  return `created_at >= NOW() - INTERVAL '7 days'`;
      case 'month': return `created_at >= NOW() - INTERVAL '30 days'`;
    }
  }
}
