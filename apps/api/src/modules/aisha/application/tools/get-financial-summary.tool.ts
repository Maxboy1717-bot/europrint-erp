/**
 * @module get-financial-summary.tool
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
import { Result, Err, AppErr, safeCall } from '@common/result';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import { FINANCE_ROLES } from '@common/constants/roles.constants';
import type { IAishaTool, ToolResult, AishaToolContext } from '../../domain/tool.interface';
import { provSource, provResult, rowsOf, hasAishaRole } from './_helpers';

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

  async execute(_input: Record<string, unknown>, ctx?: AishaToolContext): Promise<Result<ToolResult<FinancialSummary>>> {
    // Discovery sweep 2026-08-03 P0 fix ("Aisha chat tool'lari RBAC-cheklovisiz ... moliya
    // ma'lumotini qaytaradi"): company-wide cash/AP/AR/revenue was queryable by any
    // authenticated Aisha user, unlike the equivalent REST endpoints (Finance module is
    // @Roles-gated). Same allow-list precedent as get-employee-info.tool.ts / FINANCE_ROLES.
    if (!hasAishaRole(ctx?.role, FINANCE_ROLES)) {
      return Err(AppErr('FORBIDDEN', "Moliyaviy ma'lumotni faqat moliya/rahbariyat so'rashi mumkin"));
    }
    return safeCall<ToolResult<FinancialSummary>>(async () => {
      const start = Date.now();
      const cash = rowsOf<{ s: number }>(await db.execute(sql`
        -- Audit 2026-08-07: bu uch so'rovning HAMMASI yiqilardi, ya'ni AIsha moliyaviy
        -- xulosani har doim 0/0/0 deb aytardi (Q-40 — "hisob ishladi" degan taassurot).
        --   * fi_gl_documents jadvali BOR, lekin unda 'amount' ham, 'account_code' ham YO'Q.
        --     Kassa qoldig'i uchun kanonik manba — gl_entries + accounts (ADR: GL kanoni
        --     gl_entries). Qoldiq = debet yig'indisi - kredit yig'indisi.
        --   * fi_ap_invoices / fi_ar_invoices jadvallari umuman YO'Q; ikkalasi ham
        --     finance_invoices ichida (invoice_type bilan ajratiladi, jonli lug'at:
        --     sales / purchase / payable), status -> payment_status.
        SELECT COALESCE(
                 SUM(CASE WHEN a_d.account_code = '1010' THEN e.amount ELSE 0 END)
               - SUM(CASE WHEN a_c.account_code = '1010' THEN e.amount ELSE 0 END), 0)::float AS s
        FROM gl_entries e
        LEFT JOIN accounts a_d ON a_d.id = e.debit_account_id
        LEFT JOIN accounts a_c ON a_c.id = e.credit_account_id
      `))[0]?.s ?? 0;
      const ap = rowsOf<{ s: number }>(await db.execute(sql`
        SELECT COALESCE(SUM(total_amount - COALESCE(paid_amount,0)),0)::float AS s
        FROM finance_invoices
        WHERE invoice_type IN ('purchase','payable') AND payment_status <> 'paid'
      `))[0]?.s ?? 0;
      const ar = rowsOf<{ s: number }>(await db.execute(sql`
        SELECT COALESCE(SUM(total_amount - COALESCE(paid_amount,0)),0)::float AS s
        FROM finance_invoices
        WHERE invoice_type = 'sales' AND payment_status <> 'paid'
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
