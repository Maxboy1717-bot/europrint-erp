import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';
import { safeCall } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class CameraRepository {
  private readonly logger = new Logger(CameraRepository.name);

  async findCameras(isActive?: boolean) {
    return safeCall(async () => {
      const r = isActive !== undefined
        ? await exec(sql`SELECT * FROM cameras WHERE is_active = ${isActive} ORDER BY code`)
        : await exec(sql`SELECT * FROM cameras ORDER BY code`);
      return (r ?? []).map(row => ({ id: row['id'], code: row['code'], name: row['name'], location: row['location'], ip_address: row['ip_address'], is_active: row['is_active'], stream_type: row['stream_type'], thumbnail_url: row['thumbnail_url'], work_center_id: row['work_center_id'] }));
    });
  }

  async getDashboardStats() {
    return safeCall(async () => {
      const rows = await exec(sql`SELECT (SELECT COUNT(*) FROM cameras WHERE is_active = true) AS active_cameras, (SELECT COUNT(*) FROM cameras WHERE is_active = false) AS offline_cameras, (SELECT COUNT(*) FROM camera_events WHERE status = 'new') AS open_events, (SELECT COUNT(*) FROM camera_events WHERE status = 'new' AND severity = 'high') AS high_severity, (SELECT COUNT(*) FROM camera_zones) AS total_zones`);
      return (rows[0] ?? {}) as Row;
    });
  }

  async findEvents(cameraId?: string, severity?: string, limit = 50, offset = 0) {
    return safeCall(async () =>
      cameraId && severity
        ? exec(sql`SELECT * FROM camera_events WHERE camera_id = ${cameraId} AND severity = ${severity} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
        : cameraId
        ? exec(sql`SELECT * FROM camera_events WHERE camera_id = ${cameraId} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
        : severity
        ? exec(sql`SELECT * FROM camera_events WHERE severity = ${severity} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
        : exec(sql`SELECT * FROM camera_events ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
    );
  }

  async findZones() {
    return safeCall(async () => exec(sql`SELECT * FROM camera_zones ORDER BY name`));
  }

  async findAlerts(status?: string, limit = 50, offset = 0) {
    return safeCall(async () =>
      status !== undefined
        ? exec(sql`SELECT * FROM camera_alerts WHERE status = ${status} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
        : exec(sql`SELECT * FROM camera_alerts ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
    );
  }
}
