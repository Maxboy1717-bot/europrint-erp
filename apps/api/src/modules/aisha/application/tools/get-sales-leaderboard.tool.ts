/**
 * @module get-sales-leaderboard.tool
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

const SALES_LEADERBOARD_ROLES = ['sales_manager', 'manager', 'SALES', 'director', 'super_admin'];

export interface SalesLeaderboardEntry {
  managerId: number;
  managerName: string;
  totalRevenue: number;
  orderCount: number;
  rank: number;
}

@Injectable()
export class GetSalesLeaderboardTool implements IAishaTool {
  readonly definition = {
    name: 'get_sales_leaderboard',
    description: "Savdo menejerlari reytingi (davr bo'yicha daromad, buyurtma soni) — kim eng yaxshi natija ko'rsatmoqda.",
    input_schema: {
      type: 'object' as const,
      properties: {
        period: { type: 'string', description: 'monthly (standart) | quarterly | yearly' },
        limit:  { type: 'number', description: "Nechta menejer ko'rsatilsin (standart 10)" },
      },
    },
  };

  async execute(input: Record<string, unknown>, ctx?: AishaToolContext): Promise<Result<ToolResult<SalesLeaderboardEntry[]>>> {
    // AI blueprint Faza 2 (2026-08-08): mirrors sd-dashboard.repository.ts's
    // getManagerLeaderboard() SQL exactly (SB0592 — employees -> crm_leads.manager_id ->
    // sales_orders join, RANK() OVER window), the same formula already trusted by the SD
    // dashboard's own leaderboard endpoint, not a freshly-invented ranking.
    if (!hasAishaRole(ctx?.role, SALES_LEADERBOARD_ROLES)) {
      return Err(AppErr('FORBIDDEN', "Menejerlar reytingini faqat sotuv/rahbariyat so'rashi mumkin"));
    }
    const periodInput = String(input['period'] ?? 'monthly');
    const interval = periodInput === 'quarterly' ? '3 months' : periodInput === 'yearly' ? '12 months' : '1 month';
    const limitRaw = Number(input['limit'] ?? 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.trunc(limitRaw), 50) : 10;

    return safeCall<ToolResult<SalesLeaderboardEntry[]>>(async () => {
      const start = Date.now();
      const rows = rowsOf<{
        manager_id: number; manager_name: string; total_revenue: number; order_count: number; rank: number;
      }>(await db.execute(sql`
        SELECT
          e.id AS manager_id,
          CONCAT(e.first_name, ' ', e.last_name) AS manager_name,
          COALESCE(SUM(o.total_value), 0)::numeric(15,2) AS total_revenue,
          COUNT(o.id)::int AS order_count,
          RANK() OVER (ORDER BY COALESCE(SUM(o.total_value), 0) DESC)::int AS rank
        FROM employees e
        LEFT JOIN crm_leads l ON l.manager_id = e.id
        LEFT JOIN sales_orders o
          ON o.customer_id = l.customer_id
          AND o.created_at >= NOW() - ${interval}::interval
          AND o.deleted_at IS NULL
        GROUP BY e.id, e.first_name, e.last_name
        ORDER BY total_revenue DESC
        LIMIT ${limit}
      `));
      const data: SalesLeaderboardEntry[] = rows.map(r => ({
        managerId: r.manager_id,
        managerName: r.manager_name,
        totalRevenue: Number(r.total_revenue),
        orderCount: r.order_count,
        rank: r.rank,
      }));
      return provResult<SalesLeaderboardEntry[]>({
        data,
        sources: [
          provSource({ type: 'database', identifier: 'sd.manager_leaderboard', startMs: start, rowCount: data.length }),
        ],
      });
    });
  }
}
