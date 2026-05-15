/**
 * @module get-financial-summary.tool
 */

// NOTE: Raw SQL is intentional for AIsha tools. Each tool aggregates
// across multiple cross-module tables (sales, production, HR, finance,
// security, kanban) that the AIsha module does not own. Importing every
// Drizzle schema would create tight coupling between AIsha and every
// other domain module; the read-only / single-INSERT raw SQL keeps
// AIsha as a loose query-adapter layer over the ERP. Drizzle ORM is
// used elsewhere; see [[aisha-final-report]] for the architectural
// rationale.

import { Injectable } from '@nestjs/common';
import { Result, safeCall } from '@common/result';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult, rowsOf } from './_helpers';

export interface FinancialSummary {
  cashPosition: number;
  apTotal:      number;
  arTotal:      number;
  todayRevenue: number;
}

@Injectable()
export class GetFinancialSummaryTool implements IAishaTool {
  readonly definition = {
    name: 'get_financial_summary',
    description: 'Moliyaviy holat: kassa, kreditorlik, debitorlik, bugungi tushum.',
    input_schema: { type: 'object' as const, properties: {} },
  };

  async execute(): Promise<Result<ToolResult<FinancialSummary>>> {
    return safeCall<ToolResult<FinancialSummary>>(async () => {
      const start = Date.now();
      const cash = rowsOf<{ s: number }>(await db.execute(sql`
        SELECT COALESCE(SUM(amount),0)::float AS s FROM fi_gl_documents WHERE account_code = '1010'
      `))[0]?.s ?? 0;
      const ap = rowsOf<{ s: number }>(await db.execute(sql`
        SELECT COALESCE(SUM(amount),0)::float AS s FROM fi_ap_invoices WHERE status='open'
      `))[0]?.s ?? 0;
      const ar = rowsOf<{ s: number }>(await db.execute(sql`
        SELECT COALESCE(SUM(amount),0)::float AS s FROM fi_ar_invoices WHERE status='open'
      `))[0]?.s ?? 0;
      const rev = rowsOf<{ s: number }>(await db.execute(sql`
        SELECT COALESCE(SUM(total),0)::float AS s FROM sales_orders WHERE created_at::date = CURRENT_DATE AND status IN ('paid','delivered')
      `))[0]?.s ?? 0;
      return provResult<FinancialSummary>({
        data: { cashPosition: cash, apTotal: ap, arTotal: ar, todayRevenue: rev },
        sources: [
          provSource({ type: 'database', identifier: 'fi.gl_documents', startMs: start, rowCount: 1 }),
          provSource({ type: 'database', identifier: 'fi.ap_invoices', startMs: start, rowCount: 1 }),
          provSource({ type: 'database', identifier: 'fi.ar_invoices', startMs: start, rowCount: 1 }),
          provSource({ type: 'database', identifier: 'sd.sales_orders', startMs: start, rowCount: 1 }),
        ],
      });
    });
  }
}
