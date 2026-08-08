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
  /** `cameras.is_active` proxy — jadvalda haqiqiy online/heartbeat ustuni yo'q (Q-40: fabrikatsiya yo'q). */
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
      // FIX (FAZA Q): jadval nomi `iot_cameras` emas — haqiqiy nomi `cameras` (Drizzle:
      // shared/db/schema-misc-iot.ts). `is_online`/`last_heartbeat` ustunlari umuman
      // mavjud emas — bu tool ishga tushirilsa xato berardi (buzuq/eskirgan kod, Q-46).
      // `is_active` haqiqiy "onlayn" proksi sifatida ishlatiladi; heartbeat ma'lumoti
      // yo'qligi sababli har doim null qaytariladi (soxta qiymat o'ylab topilmaydi).
      const rows = rowsOf<{
        id: string; name: string; location: string | null; stream_url: string | null;
        is_active: boolean;
      }>(await db.execute(sql`
        SELECT id::text, name, location, stream_url, is_active
        FROM cameras
        WHERE is_active = true
          AND deleted_at IS NULL
          AND (${zone} = '' OR location ILIKE '%' || ${zone} || '%')
        ORDER BY name
      `));
      const data = rows.map(r => ({
        id: r.id, name: r.name, location: r.location ?? '', streamUrl: r.stream_url ?? '',
        isOnline: r.is_active, lastHeartbeat: null,
      }));
      return provResult<CameraInfo[]>({
        data,
        sources: [provSource({ type: 'database', identifier: 'iot.cameras', startMs: start, rowCount: data.length })],
        citations: data.slice(0, 5).map(c => ({ label: c.name, url: `/iot/cameras/${c.id}` })),
      });
    });
  }
}
