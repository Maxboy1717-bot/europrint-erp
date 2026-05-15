/**
 * @module get-machine-status.tool
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

export interface MachineStatus {
  machineId: string;
  name:      string;
  state:     string;
  oee:       number;
  operator:  string | null;
  lastDowntimeMin: number | null;
}

@Injectable()
export class GetMachineStatusTool implements IAishaTool {
  readonly definition = {
    name: 'get_machine_status',
    description: 'Mashinaning hozirgi holati: state, OEE, operator, oxirgi downtime.',
    input_schema: {
      type: 'object' as const,
      properties: {
        machineId: { type: 'string', description: 'Mashina IDsi yoki nomi' },
      },
      required: ['machineId'],
    },
  };

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<MachineStatus>>> {
    const id = String(input['machineId'] ?? '');
    if (!id) return Err(AppErr('VALIDATION', 'machineId majburiy'));

    return safeCall<ToolResult<MachineStatus>>(async () => {
      const start = Date.now();
      const rows = rowsOf<{
        id: string; name: string; current_state: string;
        current_oee: number; current_operator: string | null;
      }>(await db.execute(sql`
        SELECT id, name, current_state, current_oee, current_operator
        FROM iot_machine_registry
        WHERE id = ${id} OR LOWER(name) = LOWER(${id})
        LIMIT 1
      `));
      if (!rows[0]) throw new Error(`Mashina topilmadi: ${id}`);
      const m = rows[0];
      const dt = rowsOf<{ m: number }>(await db.execute(sql`
        SELECT EXTRACT(EPOCH FROM (ended_at - started_at))/60 AS m
        FROM downtime_events WHERE machine_id = ${m.id}
        ORDER BY started_at DESC LIMIT 1
      `))[0]?.m ?? null;
      return provResult<MachineStatus>({
        data: {
          machineId: m.id, name: m.name, state: m.current_state,
          oee: m.current_oee, operator: m.current_operator,
          lastDowntimeMin: dt,
        },
        sources: [
          provSource({ type: 'database', identifier: 'iot.machine_registry', startMs: start, rowCount: 1 }),
          provSource({ type: 'database', identifier: 'mes.downtime_events', startMs: start, rowCount: dt === null ? 0 : 1 }),
        ],
        citations: [{ label: m.name, url: `/iot/machines/${m.id}` }],
      });
    });
  }
}
