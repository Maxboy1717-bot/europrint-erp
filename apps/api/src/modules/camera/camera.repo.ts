/**
 * @module camera.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';
import { safeCall } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

const rawExec = (q: SQL | SQLWrapper) => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class CameraRepository {
  private readonly logger = new Logger(CameraRepository.name);

  async findCameras(isActive?: boolean) {
    return safeCall(async () => {
      const r = isActive !== undefined
        ? await exec(sql`SELECT * FROM cameras WHERE is_active = ${isActive} ORDER BY code`)
        : await exec(sql`SELECT * FROM cameras ORDER BY code`);
      return (Array.isArray(r) ? r : []).map(row => ({ id: row['id'], code: row['code'], name: row['name'], location: row['location'], ip_address: row['ip_address'], is_active: row['is_active'], stream_type: row['stream_type'], thumbnail_url: row['thumbnail_url'], work_center_id: row['work_center_id'] }));
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

  async enrollFacePlaceholder(employeeId: number, imageUrl: string | null) {
    return rawExec(sql`
      INSERT INTO face_embeddings (employee_id, embedding, is_active, confidence, image_url, created_at, updated_at)
      VALUES (${employeeId}, NULL, false, 'pending', ${imageUrl}, NOW(), NOW())
      ON CONFLICT DO NOTHING
      RETURNING id, employee_id, is_active, confidence
    `);
  }

  async getViolationById(violationId: number) {
    return rawExec(sql`
      SELECT sv.*, e.first_name, e.last_name
      FROM camera_safety_violations sv
      LEFT JOIN employees e ON e.id::text = sv.employee_id
      WHERE sv.id = ${violationId}
      LIMIT 1
    `);
  }

  async createDisciplineDraft(employeeId: number, violationType: string, severity: string, description: string, violationDate: string) {
    return rawExec(sql`
      INSERT INTO discipline_records
        (employee_id, violation_type, discipline_type, severity, description, violation_date, status, created_at, updated_at)
      VALUES
        (${employeeId}, ${violationType}, 'camera_auto', ${severity}, ${description}, ${violationDate}, 'draft', NOW(), NOW())
      RETURNING id, employee_id, violation_type, severity, status
    `);
  }
}
