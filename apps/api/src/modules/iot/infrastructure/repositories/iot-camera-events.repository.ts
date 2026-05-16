/**
 * @module iot-camera-events.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (IoT)
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import type { IIotCameraEventsRepo } from '../../domain/repositories/i-iot-camera-events.repo';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class IotCameraEventsRepository implements IIotCameraEventsRepo {
  async listCameraEvents(cameraId?: string, type?: string, lim = 50): Promise<Result<Row[]>>  {
  try {
      const camInt = cameraId ? parseInt(cameraId, 10) : null;
      return camInt && type
        ? exec(sql`SELECT ce.*, c.name AS camera_name FROM camera_events ce LEFT JOIN cameras c ON c.id = ce.camera_id WHERE ce.camera_id = ${camInt} AND ce.event_type = ${type} ORDER BY ce.created_at DESC LIMIT ${lim}`)
        : camInt
        ? exec(sql`SELECT ce.*, c.name AS camera_name FROM camera_events ce LEFT JOIN cameras c ON c.id = ce.camera_id WHERE ce.camera_id = ${camInt} ORDER BY ce.created_at DESC LIMIT ${lim}`)
        : type
        ? exec(sql`SELECT ce.*, c.name AS camera_name FROM camera_events ce LEFT JOIN cameras c ON c.id = ce.camera_id WHERE ce.event_type = ${type} ORDER BY ce.created_at DESC LIMIT ${lim}`)
        : exec(sql`SELECT ce.*, c.name AS camera_name FROM camera_events ce LEFT JOIN cameras c ON c.id = ce.camera_id ORDER BY ce.created_at DESC LIMIT ${lim}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createCameraEvent(camera_id: number, event_type: string, description: string | null, severity: string, zone_id: number | null): Promise<Result<Row>>  {
  try {
      const r = await exec(sql`INSERT INTO camera_events (camera_id, event_type, description, severity, zone_id, status) VALUES (${camera_id}, ${event_type}, ${description}, ${severity}, ${zone_id}, 'open') RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateCameraEvent(id: number, status: string | null, resolution_note: string | null): Promise<Result<Row>>  {
  try {
      const r = await exec(sql`UPDATE camera_events SET status = COALESCE(${status}, status), resolution_note = COALESCE(${resolution_note}, resolution_note), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listSafetyViolations(cameraId?: string, status?: string, lim = 50): Promise<Result<Row[]>>  {
  try {
      const camInt = cameraId ? parseInt(cameraId, 10) : null;
      return camInt && status
        ? exec(sql`SELECT sv.*, c.name AS camera_name FROM camera_safety_violations sv LEFT JOIN cameras c ON c.id = sv.camera_id WHERE sv.camera_id = ${camInt} AND sv.status = ${status} ORDER BY sv.detected_at DESC LIMIT ${lim}`)
        : camInt
        ? exec(sql`SELECT sv.*, c.name AS camera_name FROM camera_safety_violations sv LEFT JOIN cameras c ON c.id = sv.camera_id WHERE sv.camera_id = ${camInt} ORDER BY sv.detected_at DESC LIMIT ${lim}`)
        : status
        ? exec(sql`SELECT sv.*, c.name AS camera_name FROM camera_safety_violations sv LEFT JOIN cameras c ON c.id = sv.camera_id WHERE sv.status = ${status} ORDER BY sv.detected_at DESC LIMIT ${lim}`)
        : exec(sql`SELECT sv.*, c.name AS camera_name FROM camera_safety_violations sv LEFT JOIN cameras c ON c.id = sv.camera_id ORDER BY sv.detected_at DESC LIMIT ${lim}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createSafetyViolation(camera_id: number, violation_type: string, severity: string, description: string | null, employee_id: number | null): Promise<Result<Row>>  {
  try {
      const r = await exec(sql`INSERT INTO camera_safety_violations (camera_id, violation_type, severity, description, employee_id, status) VALUES (${camera_id}, ${violation_type}, ${severity}, ${description}, ${employee_id}, 'open') RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listQualityDefects(cameraId?: string, status?: string): Promise<Result<Row[]>>  {
  try {
      const camInt = cameraId ? parseInt(cameraId, 10) : null;
      return camInt && status
        ? exec(sql`SELECT qd.*, c.name AS camera_name FROM camera_quality_defects qd LEFT JOIN cameras c ON c.id = qd.camera_id WHERE qd.camera_id = ${camInt} AND qd.status = ${status} ORDER BY qd.detected_at DESC LIMIT 100`)
        : camInt
        ? exec(sql`SELECT qd.*, c.name AS camera_name FROM camera_quality_defects qd LEFT JOIN cameras c ON c.id = qd.camera_id WHERE qd.camera_id = ${camInt} ORDER BY qd.detected_at DESC LIMIT 100`)
        : status
        ? exec(sql`SELECT qd.*, c.name AS camera_name FROM camera_quality_defects qd LEFT JOIN cameras c ON c.id = qd.camera_id WHERE qd.status = ${status} ORDER BY qd.detected_at DESC LIMIT 100`)
        : exec(sql`SELECT qd.*, c.name AS camera_name FROM camera_quality_defects qd LEFT JOIN cameras c ON c.id = qd.camera_id ORDER BY qd.detected_at DESC LIMIT 100`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createQualityDefect(camera_id: number, defect_type: string, severity: string, description: string | null): Promise<Result<Row>>  {
  try {
      const r = await exec(sql`INSERT INTO camera_quality_defects (camera_id, defect_type, severity, description, status) VALUES (${camera_id}, ${defect_type}, ${severity}, ${description}, 'open') RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateQualityDefect(id: number, status: string | null, resolution: string | null): Promise<Result<Row>>  {
  try {
      const r = await exec(sql`UPDATE camera_quality_defects SET status = COALESCE(${status}, status), resolution = COALESCE(${resolution}, resolution), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
