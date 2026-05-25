/**
 * @module list-available-cameras.tool
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

export interface CameraInfo {
  id: string; name: string; location: string; streamUrl: string;
  isOnline: boolean; lastHeartbeat: string | null;
}

@Injectable()
export class ListAvailableCamerasTool implements IAishaTool {
  readonly definition = {
    name: 'list_available_cameras',
    description: 'Online kameralar ro\'yxati: id, nom, joylashuv, stream URL.',
    input_schema: {
      type: 'object' as const,
      properties: { zone: { type: 'string', description: 'Hudud kodi (ixtiyoriy)' } },
    },
  };

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<CameraInfo[]>>> {
    const zone = String(input['zone'] ?? '');
    return safeCall<ToolResult<CameraInfo[]>>(async () => {
      const start = Date.now();
      const rows = rowsOf<{
        id: string; name: string; location: string; stream_url: string;
        is_online: boolean; last_heartbeat: string | null;
      }>(await db.execute(sql`
        SELECT id::text, name, location, stream_url, is_online, last_heartbeat::text
        FROM iot_cameras
        WHERE is_online = true
          AND (${zone} = '' OR location ILIKE '%' || ${zone} || '%')
        ORDER BY name
      `));
      const data = rows.map(r => ({
        id: r.id, name: r.name, location: r.location, streamUrl: r.stream_url,
        isOnline: r.is_online, lastHeartbeat: r.last_heartbeat,
      }));
      return provResult<CameraInfo[]>({
        data,
        sources: [provSource({ type: 'database', identifier: 'iot.cameras', startMs: start, rowCount: data.length })],
        citations: data.slice(0, 5).map(c => ({ label: c.name, url: `/iot/cameras/${c.id}` })),
      });
    });
  }
}
