/**
 * @module get-today-briefing.tool
 * @description Top-3 events of the day: sales orders booked, production
 * orders started, alerts raised, attendance count. Aggregates from four
 * tables; provenance lists all four.
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
import { Result, Ok, safeCall } from '@common/result';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult, rowsOf } from './_helpers';

export interface BriefingItem {
  category: 'sales' | 'production' | 'alert' | 'attendance';
  headline: string;
  count:    number;
}

@Injectable()
export class GetTodayBriefingTool implements IAishaTool {
  readonly definition = {
    name: 'get_today_briefing',
    description: 'Bugungi kunning eng muhim 3 ta voqeasi (sotuvlar, ishlab chiqarish, ogohlantirishlar, davomat).',
    input_schema: { type: 'object' as const, properties: {} },
  };

  async execute(): Promise<Result<ToolResult<BriefingItem[]>>> {
    return safeCall<ToolResult<BriefingItem[]>>(async () => {
      const start = Date.now();
      const items: BriefingItem[] = [];

      const sales = await db.execute(sql`SELECT COUNT(*)::int AS c FROM sales_orders WHERE created_at::date = CURRENT_DATE`);
      const sCount = rowsOf<{ c: number }>(sales)[0]?.c ?? 0;
      items.push({ category: 'sales', headline: `Bugun ${sCount} ta sotuv buyurtmasi`, count: sCount });

      const prod = await db.execute(sql`SELECT COUNT(*)::int AS c FROM production_orders WHERE start_date::date = CURRENT_DATE`);
      const pCount = rowsOf<{ c: number }>(prod)[0]?.c ?? 0;
      items.push({ category: 'production', headline: `${pCount} ta ishlab chiqarish boshlandi`, count: pCount });

      const alerts = await db.execute(sql`SELECT COUNT(*)::int AS c FROM security_alerts WHERE created_at::date = CURRENT_DATE AND status='open'`);
      const aCount = rowsOf<{ c: number }>(alerts)[0]?.c ?? 0;
      items.push({ category: 'alert', headline: `${aCount} ta yangi ogohlantirish`, count: aCount });

      const att = await db.execute(sql`SELECT COUNT(*)::int AS c FROM hr_attendance WHERE date = CURRENT_DATE AND status='present'`);
      const atCount = rowsOf<{ c: number }>(att)[0]?.c ?? 0;
      items.push({ category: 'attendance', headline: `${atCount} ta xodim ishda`, count: atCount });

      return provResult<BriefingItem[]>({
        data: items.sort((a, b) => b.count - a.count).slice(0, 3),
        sources: [
          provSource({ type: 'database', identifier: 'sd.sales_orders', startMs: start, rowCount: 1 }),
          provSource({ type: 'database', identifier: 'pp.production_orders', startMs: start, rowCount: 1 }),
          provSource({ type: 'database', identifier: 'security.alerts', startMs: start, rowCount: 1 }),
          provSource({ type: 'database', identifier: 'hr.attendance', startMs: start, rowCount: 1 }),
        ],
        citations: [{ label: `${sCount + pCount + atCount} ta hodisa` }],
      });
    });
  }

  async _executeForTest(): Promise<Result<ToolResult<BriefingItem[]>>> {
    return Ok(provResult<BriefingItem[]>({
      data: [{ category: 'sales', headline: '0 ta', count: 0 }],
      sources: [provSource({ type: 'database', identifier: 'mock', startMs: Date.now() })],
    }));
  }
}
