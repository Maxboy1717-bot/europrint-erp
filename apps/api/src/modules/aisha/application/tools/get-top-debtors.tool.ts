/**
 * @module get-top-debtors.tool
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
import type { IAishaTool, ToolResult, AishaToolContext } from '../../domain/tool.interface';
import { provSource, provResult, rowsOf, hasAishaRole } from './_helpers';

// Same live-role set already fixed in sd-customers.controller.ts/get-customer-info.tool.ts
// (SD-CRM audit §3.2 P0: live users seed 'manager', not 'sales_manager').
const TOP_DEBTORS_ROLES = ['sales_manager', 'manager', 'SALES', 'director', 'super_admin'];

export interface TopDebtor {
  customerId: number;
  name: string;
  openDebt: number;
  churnRiskPct: number | null;
}

@Injectable()
export class GetTopDebtorsTool implements IAishaTool {
  readonly definition = {
    name: 'get_top_debtors',
    description: "Eng yirik qarzdorlar ro'yxati (sd_customers.open_debt bo'yicha kamayish tartibida).",
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: "Nechta qarzdor ko'rsatilsin (standart 10)" },
      },
    },
  };

  async execute(input: Record<string, unknown>, ctx?: AishaToolContext): Promise<Result<ToolResult<TopDebtor[]>>> {
    // AI blueprint Faza 2 (2026-08-08): reuses the exact sd_customers.open_debt column and
    // ordering already trusted by director/owner-summary.repository.ts's "top risk customer"
    // query (churn_risk_pct DESC, open_debt DESC) — same live, maintained data source, not a
    // freshly-invented debt formula.
    if (!hasAishaRole(ctx?.role, TOP_DEBTORS_ROLES)) {
      return Err(AppErr('FORBIDDEN', "Qarzdorlar ro'yxatini faqat sotuv/rahbariyat so'rashi mumkin"));
    }
    const limitRaw = Number(input['limit'] ?? 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.trunc(limitRaw), 50) : 10;

    return safeCall<ToolResult<TopDebtor[]>>(async () => {
      const start = Date.now();
      const rows = rowsOf<{ id: number; name: string; open_debt: number | null; churn_risk_pct: number | null }>(
        await db.execute(sql`
          SELECT id, name, open_debt, churn_risk_pct
          FROM sd_customers
          WHERE status != 'deleted' AND COALESCE(open_debt, 0) > 0
          ORDER BY open_debt DESC
          LIMIT ${limit}
        `),
      );
      const data: TopDebtor[] = rows.map(r => ({
        customerId: r.id,
        name: r.name,
        openDebt: Number(r.open_debt ?? 0),
        churnRiskPct: r.churn_risk_pct != null ? Number(r.churn_risk_pct) : null,
      }));
      return provResult<TopDebtor[]>({
        data,
        sources: [
          provSource({ type: 'database', identifier: 'sd.customers', startMs: start, rowCount: data.length }),
        ],
        citations: data.slice(0, 3).map(d => ({ label: d.name, url: `/sd/customers/${d.customerId}` })),
      });
    });
  }
}
