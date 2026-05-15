/**
 * @module get-active-alerts.tool
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

export interface AlertItem {
  id: string; source: string; severity: string; title: string; createdAt: string;
}

@Injectable()
export class GetActiveAlertsTool implements IAishaTool {
  readonly definition = {
    name: 'get_active_alerts',
    description: 'Top-10 ochiq ogohlantirishlar (security/iot/ai_agents).',
    input_schema: { type: 'object' as const, properties: {} },
  };

  async execute(): Promise<Result<ToolResult<AlertItem[]>>> {
    return safeCall<ToolResult<AlertItem[]>>(async () => {
      const start = Date.now();
      const sec = rowsOf<AlertItem>(await db.execute(sql`
        SELECT id::text, 'security' AS source, severity, title, created_at::text AS "createdAt"
        FROM security_alerts WHERE status='open' ORDER BY created_at DESC LIMIT 10
      `));
      const iot = rowsOf<AlertItem>(await db.execute(sql`
        SELECT id::text, 'iot' AS source, severity, title, created_at::text AS "createdAt"
        FROM iot_sensor_alerts WHERE status='open' ORDER BY created_at DESC LIMIT 10
      `));
      const ai = rowsOf<AlertItem>(await db.execute(sql`
        SELECT id::text, 'ai_agents' AS source, severity, title, created_at::text AS "createdAt"
        FROM ai_agent_alerts WHERE status='open' ORDER BY created_at DESC LIMIT 10
      `));
      const merged = [...sec, ...iot, ...ai]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 10);
      return provResult<AlertItem[]>({
        data: merged,
        sources: [
          provSource({ type: 'database', identifier: 'security.alerts', startMs: start, rowCount: sec.length }),
          provSource({ type: 'database', identifier: 'iot.sensor_alerts', startMs: start, rowCount: iot.length }),
          provSource({ type: 'database', identifier: 'ai_agents.alerts', startMs: start, rowCount: ai.length }),
        ],
        citations: [{ label: `${merged.length} ta yangi ogohlantirish` }],
      });
    });
  }
}
