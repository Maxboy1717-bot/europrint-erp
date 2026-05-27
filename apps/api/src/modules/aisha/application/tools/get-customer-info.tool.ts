/**
 * @module get-customer-info.tool
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
import { Result, Ok, Err, AppErr } from '@common/result';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult, rowsOf } from './_helpers';

export interface CustomerInfo {
  customerId: string; name: string; clv: number;
  orders6mCount: number; orders6mTotal: number;
  rfmScore: string;
}

@Injectable()
export class GetCustomerInfoTool implements IAishaTool {
  readonly definition = {
    name: 'get_customer_info',
    description: 'Mijoz haqida: CLV, oxirgi 6 oy buyurtmalari, RFM bali.',
    input_schema: {
      type: 'object' as const,
      properties: {
        customerName: { type: 'string', description: 'Mijoz nomi yoki IDsi' },
      },
      required: ['customerName'],
    },
  };

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<CustomerInfo>>> {
    const name = String(input['customerName'] ?? '');
    if (!name) return Err(AppErr('VALIDATION', 'customerName majburiy'));

    try {
      const start = Date.now();
      const cust = rowsOf<{ id: string; name: string }>(await db.execute(sql`
        SELECT id, name FROM crm_companies
        WHERE LOWER(name) LIKE LOWER('%' || ${name} || '%') LIMIT 1
      `))[0];
      if (!cust) return Err(AppErr('NOT_FOUND', `Mijoz topilmadi: ${name}`));

      const agg = rowsOf<{ cnt: number; total: number }>(await db.execute(sql`
        SELECT COUNT(*)::int AS cnt, COALESCE(SUM(total),0)::float AS total
        FROM sales_orders
        WHERE customer_id = ${cust.id} AND created_at > NOW() - INTERVAL '6 months'
      `))[0] ?? { cnt: 0, total: 0 };

      const deals = rowsOf<{ s: number }>(await db.execute(sql`
        SELECT COALESCE(SUM(value),0)::float AS s FROM crm_deals
        WHERE customer_id = ${cust.id} AND stage = 'won'
      `))[0]?.s ?? 0;

      const clv = deals + agg.total;
      const rfm = agg.cnt > 10 ? 'A' : agg.cnt > 3 ? 'B' : 'C';

      return Ok(provResult<CustomerInfo>({
        data: {
          customerId: cust.id, name: cust.name, clv,
          orders6mCount: agg.cnt, orders6mTotal: agg.total, rfmScore: rfm,
        },
        sources: [
          provSource({ type: 'database', identifier: 'crm.companies', startMs: start, rowCount: 1 }),
          provSource({ type: 'database', identifier: 'sd.sales_orders', startMs: start, rowCount: agg.cnt }),
          provSource({ type: 'database', identifier: 'crm.deals', startMs: start, rowCount: 1 }),
        ],
        citations: [{ label: cust.name, url: `/crm/companies/${cust.id}` }],
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return Err(AppErr('EXTERNAL_SERVICE', msg));
    }
  }
}
