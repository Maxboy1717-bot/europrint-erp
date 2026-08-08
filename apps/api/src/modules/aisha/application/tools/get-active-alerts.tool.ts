/**
 * @module get-active-alerts.tool
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

      // Audit 2026-08-07/08 (docs/audit/FANTOM-JADVALLAR-2026-08-07.md +
      // POS-KIRIM-CHIQIM-VA-MES-JADVAL-TAHLILI-2026-08-08.md §8): all THREE source tables
      // below were originally phantom (do not exist in the live DB). Because the three
      // `await`s ran sequentially with no per-source try/catch, the FIRST one to throw
      // (`security_alerts`) failed the whole `safeCall` — so `get_active_alerts` returned Err
      // on every call, meaning AIsha could never surface an active alert, even in an
      // emergency (Q-40).
      //
      //   'iot'       -> `iot_sensor_alerts` did not exist; the real table is `iot_alerts`
      //                  (sensor_id/alert_type/severity/message/is_resolved) — fixed.
      //   'ai_agents' -> `ai_agent_alerts` did not exist; `agent_alerts` is the EXACT table
      //                  `AgentAlertService.send()` writes to (agent_name/severity/title/
      //                  message/is_read) — fixed, now genuinely wired to the agent pipeline.
      //   'security'  -> `security_alerts` does not exist. The live DB has FOUR distinct
      //                  candidates with different semantics: `system_alerts` (generic
      //                  cross-module feed) and `ai_alerts` (AI-insight alerts) are NOT
      //                  security-specific — folding them in here would dilute a genuine
      //                  emergency signal with routine operational noise. `sos_alerts`
      //                  (worker panic-button, tablet-raised) and `hr_tz2_security_alerts`
      //                  (camera/room presence detections) ARE both genuine physical-security
      //                  events — UNIONed below. `sos_alerts` has no camera-derived analogue
      //                  and vice versa, so this is additive (no data lost), not a guess
      //                  dressed as a rename (Q-34 — the "which ONE table" framing was the
      //                  wrong question; the real answer is "which tables are actually
      //                  security events", answered from each table's own writer/purpose).
      const sos = await db.execute(sql`
        SELECT id::text, 'security' AS source, 'critical' AS severity,
               ('SOS: ' || COALESCE(worker_name, 'worker#' || worker_id::text) || ' — ' || alert_type) AS title,
               created_at::text AS "createdAt"
        FROM sos_alerts WHERE status <> 'resolved' AND resolved_at IS NULL
        ORDER BY created_at DESC LIMIT 10
      `).then(rowsOf<AlertItem>).catch(() => [] as AlertItem[]);
      const roomSec = await db.execute(sql`
        SELECT id::text, 'security' AS source, 'high' AS severity,
               (event_type || COALESCE(' — ' || room_code, '')) AS title,
               created_at::text AS "createdAt"
        FROM hr_tz2_security_alerts WHERE resolved = false
        ORDER BY created_at DESC LIMIT 10
      `).then(rowsOf<AlertItem>).catch(() => [] as AlertItem[]);
      const sec = [...sos, ...roomSec]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 10);
      const iot = rowsOf<AlertItem>(await db.execute(sql`
        SELECT id::text, 'iot' AS source, severity, alert_type AS title, created_at::text AS "createdAt"
        FROM iot_alerts WHERE is_resolved = false ORDER BY created_at DESC LIMIT 10
      `));
      const ai = rowsOf<AlertItem>(await db.execute(sql`
        SELECT id::text, 'ai_agents' AS source, severity, title, created_at::text AS "createdAt"
        FROM agent_alerts WHERE is_read = false ORDER BY created_at DESC LIMIT 10
      `));
      const merged = [...sec, ...iot, ...ai]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 10);
      return provResult<AlertItem[]>({
        data: merged,
        sources: [
          provSource({ type: 'database', identifier: 'security.alerts', startMs: start, rowCount: sec.length }),
          provSource({ type: 'database', identifier: 'iot.alerts', startMs: start, rowCount: iot.length }),
          provSource({ type: 'database', identifier: 'agent.alerts', startMs: start, rowCount: ai.length }),
        ],
        citations: [{ label: `${merged.length} ta yangi ogohlantirish` }],
      });
    });
  }
}
