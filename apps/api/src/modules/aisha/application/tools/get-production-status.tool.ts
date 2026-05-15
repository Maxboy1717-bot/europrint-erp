/**
 * @module get-production-status.tool
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

export interface ProductionStatus {
  planned: number;
  actual: number;
  oee: number;
  downtimeMin: number;
}

@Injectable()
export class GetProductionStatusTool implements IAishaTool {
  readonly definition = {
    name: 'get_production_status',
    description: 'Bugungi ishlab chiqarish: rejalashtirilgan/haqiqiy/OEE/downtime.',
    input_schema: { type: 'object' as const, properties: {} },
  };

  async execute(): Promise<Result<ToolResult<ProductionStatus>>> {
    return safeCall<ToolResult<ProductionStatus>>(async () => {
      const start = Date.now();
      const planned = rowsOf<{ c: number }>(await db.execute(sql`SELECT COALESCE(SUM(qty_planned),0)::int AS c FROM production_orders WHERE start_date::date = CURRENT_DATE`))[0]?.c ?? 0;
      const actual  = rowsOf<{ c: number }>(await db.execute(sql`SELECT COALESCE(SUM(qty_produced),0)::int AS c FROM production_orders WHERE start_date::date = CURRENT_DATE`))[0]?.c ?? 0;
      const oeeRow  = rowsOf<{ oee: number }>(await db.execute(sql`SELECT AVG(oee_percent)::float AS oee FROM iot_oee_metrics WHERE date = CURRENT_DATE`))[0];
      const dt      = rowsOf<{ m: number }>(await db.execute(sql`SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (ended_at - started_at))/60),0)::int AS m FROM downtime_events WHERE started_at::date = CURRENT_DATE`))[0]?.m ?? 0;
      return provResult<ProductionStatus>({
        data: { planned, actual, oee: oeeRow?.oee ?? 0, downtimeMin: dt },
        sources: [
          provSource({ type: 'database', identifier: 'pp.production_orders', startMs: start, rowCount: 2 }),
          provSource({ type: 'database', identifier: 'iot.oee_metrics', startMs: start, rowCount: 1 }),
          provSource({ type: 'database', identifier: 'mes.downtime_events', startMs: start, rowCount: 1 }),
        ],
      });
    });
  }
}
