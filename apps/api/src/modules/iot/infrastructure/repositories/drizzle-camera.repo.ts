/**
 * @module drizzle-camera.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import {
  db, cameras, camera_events, camera_alerts,
  camera_zones, camera_quality_defects, camera_safety_violations, employees,
} from '@shared/db';
import { Ok, Err, Result } from '@common/result';

import { MS_PER_DAY } from '@common/constants/app.constants';
@Injectable()
export class DrizzleCameraRepo {
  async findRecognitionStats() {
    try {
      const yesterday = new Date(Date.now() - MS_PER_DAY);
      const [ev] = await db.select({
        today_recognitions: sql<number>`COUNT(*) FILTER (WHERE ${camera_events.created_at} >= ${yesterday} AND ${camera_events.event_type} = 'face_recognition')`,
        total_recognitions: sql<number>`COUNT(*) FILTER (WHERE ${camera_events.event_type} = 'face_recognition')`,
        flagged_logs: sql<number>`COUNT(*) FILTER (WHERE ${camera_events.event_type} = 'face_recognition' AND ${camera_events.status} = 'flagged')`,
      }).from(camera_events);
      const [camCount] = await db.select({ active_cameras: count(cameras.id) })
        .from(cameras).where(eq(cameras.is_active, true));
      return Ok({ ...ev, ...camCount });
    } catch (e) { return Err((e as Error).message); }
  }

  async findRecognitionLogs(limit: number, cameraId: string | undefined, flagged: string | undefined) {
    try {
      const conds = [eq(camera_events.event_type, 'face_recognition')];
      if (cameraId) conds.push(eq(camera_events.camera_id, cameraId));
      if (flagged) conds.push(eq(camera_events.status, flagged));
      const rows = await db.select({
        id: camera_events.id,
        camera_id: camera_events.camera_id,
        event_type: camera_events.event_type,
        description: camera_events.description,
        severity: camera_events.severity,
        status: camera_events.status,
        created_at: camera_events.created_at,
        camera_name: cameras.name,
        location: cameras.location,
      })
        .from(camera_events)
        .leftJoin(cameras, sql`${cameras.id}::text = ${camera_events.camera_id}`)
        .where(and(...conds))
        .orderBy(desc(camera_events.created_at))
        .limit(limit);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async flagRecognitionLog(id: number) {
    try {
      const rows = await db.update(camera_events)
        .set({ status: 'flagged' })
        .where(and(eq(camera_events.id, id), eq(camera_events.event_type, 'face_recognition')))
        .returning({ id: camera_events.id, status: camera_events.status });
      return Ok(rows[0] ?? { id, status: 'flagged' as const });
    } catch (e) { return Err((e as Error).message); }
  }

  async unflagRecognitionLog(id: number) {
    try {
      const rows = await db.update(camera_events)
        .set({ status: 'new' })
        .where(and(eq(camera_events.id, id), eq(camera_events.event_type, 'face_recognition')))
        .returning({ id: camera_events.id, status: camera_events.status });
      return Ok(rows[0] ?? { id, status: 'new' as const });
    } catch (e) { return Err((e as Error).message); }
  }

  async findCameraAlerts(status: string | undefined, severity: string | undefined, limit: number) {
    try {
      const conds = [];
      if (status === 'open') conds.push(eq(camera_alerts.is_resolved, false));
      else if (status === 'resolved') conds.push(eq(camera_alerts.is_resolved, true));
      if (severity) conds.push(eq(camera_alerts.severity, severity));
      const rows = await db.select({
        id: camera_alerts.id,
        camera_id: camera_alerts.camera_id,
        alert_type: camera_alerts.alert_type,
        severity: camera_alerts.severity,
        title: camera_alerts.title,
        is_acknowledged: camera_alerts.is_acknowledged,
        is_resolved: camera_alerts.is_resolved,
        created_at: camera_alerts.created_at,
        camera_name: cameras.name,
        location: cameras.location,
      })
        .from(camera_alerts)
        .leftJoin(cameras, sql`${cameras.id}::text = ${camera_alerts.camera_id}`)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(camera_alerts.created_at))
        .limit(limit);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async acknowledgeAlert(id: number) {
    try {
      const rows = await db.update(camera_alerts)
        .set({ is_acknowledged: true })
        .where(eq(camera_alerts.id, id))
        .returning({ id: camera_alerts.id, is_acknowledged: camera_alerts.is_acknowledged });
      return Ok(rows[0] ?? { id, is_acknowledged: true as const });
    } catch (e) { return Err((e as Error).message); }
  }

  async resolveAlert(id: number, notes: string | undefined) {
    try {
      const rows = await db.update(camera_alerts)
        .set({ is_resolved: true, resolution_notes: notes ?? null, resolved_at: _time.now() })
        .where(eq(camera_alerts.id, id))
        .returning({
          id: camera_alerts.id,
          is_resolved: camera_alerts.is_resolved,
          resolution_notes: camera_alerts.resolution_notes,
        });
      return Ok(rows[0] ?? { id, is_resolved: true as const, resolution_notes: notes ?? null });
    } catch (e) { return Err((e as Error).message); }
  }

  async findCameraSettings() {
    try {
      const rows = await db.select({
        id: cameras.id,
        code: cameras.code,
        name: cameras.name,
        location: cameras.location,
        is_active: cameras.is_active,
        ip_address: cameras.ip_address,
        rtsp_url: cameras.rtsp_url,
        zone_name: camera_zones.zone_name,
        zone_type: camera_zones.zone_type,
        created_at: cameras.created_at,
      })
        .from(cameras)
        .leftJoin(camera_zones, eq(camera_zones.camera_id, cameras.id))
        .orderBy(cameras.name);
      return Ok({ cameras: rows });
    } catch (e) { return Err((e as Error).message); }
  }

  async updateCameraStatus(id: number, status: string) {
    try {
      const rows = await db.update(cameras)
        .set({ is_active: status === 'active' })
        .where(eq(cameras.id, id))
        .returning({ id: cameras.id, name: cameras.name, is_active: cameras.is_active });
      return Ok(rows[0] ?? { id, name: null, is_active: status === 'active' });
    } catch (e) { return Err((e as Error).message); }
  }

  async listCameras(status: string | undefined, _type: string | undefined) {
    try {
      const cond = status !== undefined ? eq(cameras.is_active, status === 'active') : undefined;
      const rows = await db.select({
        id: cameras.id,
        code: cameras.code,
        name: cameras.name,
        location: cameras.location,
        ip_address: cameras.ip_address,
        rtsp_url: cameras.rtsp_url,
        is_active: cameras.is_active,
        zone_name: camera_zones.zone_name,
        created_at: cameras.created_at,
      })
        .from(cameras)
        .leftJoin(camera_zones, eq(camera_zones.camera_id, cameras.id))
        .where(cond)
        .orderBy(cameras.name);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findCameraById(id: number) {
    try {
      const [cam] = await db.select({
        id: cameras.id,
        code: cameras.code,
        name: cameras.name,
        location: cameras.location,
        ip_address: cameras.ip_address,
        rtsp_url: cameras.rtsp_url,
        is_active: cameras.is_active,
        created_at: cameras.created_at,
        zone_name: camera_zones.zone_name,
        zone_type: camera_zones.zone_type,
      })
        .from(cameras)
        .leftJoin(camera_zones, eq(camera_zones.camera_id, cameras.id))
        .where(eq(cameras.id, id));
      if (!cam) return Ok(null);
      const [evCount] = await db.select({
        total: count(camera_events.id),
        open: sql<number>`COUNT(*) FILTER (WHERE ${camera_events.status} = 'new')`,
      }).from(camera_events).where(eq(camera_events.camera_id, String(id)));
      return Ok({ ...cam, total_events: evCount?.total ?? 0, open_events: evCount?.open ?? 0 });
    } catch (e) { return Err((e as Error).message); }
  }

  async findQualityDefects(
    status: string | undefined,
    cameraId: string | undefined,
    defectType: string | undefined,
    limit: number,
  ) {
    try {
      const conds = [];
      if (status) conds.push(eq(camera_quality_defects.status, status));
      if (cameraId) conds.push(eq(camera_quality_defects.camera_id, cameraId));
      if (defectType) conds.push(eq(camera_quality_defects.defect_type, defectType));
      const rows = await db.select({
        id: camera_quality_defects.id,
        camera_id: camera_quality_defects.camera_id,
        defect_type: camera_quality_defects.defect_type,
        severity: camera_quality_defects.severity,
        status: camera_quality_defects.status,
        description: camera_quality_defects.description,
        detected_at: camera_quality_defects.detected_at,
        resolved_at: camera_quality_defects.resolved_at,
        camera_name: cameras.name,
        location: cameras.location,
      })
        .from(camera_quality_defects)
        .leftJoin(cameras, sql`${cameras.id}::text = ${camera_quality_defects.camera_id}`)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(camera_quality_defects.detected_at))
        .limit(limit);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findEmployeeRatings(limit: number, employeeId: string | undefined) {
    try {
      const cond = employeeId ? sql`${employees.id}::text = ${employeeId}` : eq(employees.status, 'active');
      const rows = await db.select({
        employee_id: employees.id,
        full_name: sql<string>`COALESCE("employees"."full_name", '')`,
        department_id: sql<string>`"employees"."department_id"::text`,
        total_violations: sql<number>`COUNT(${camera_safety_violations.id})`,
        high_violations: sql<number>`COUNT(${camera_safety_violations.id}) FILTER (WHERE ${camera_safety_violations.severity} = 'high')`,
        safety_rating: sql<number>`ROUND((100.0 - LEAST(COUNT(${camera_safety_violations.id})::float * 5, 100))::numeric, 1)`,
      })
        .from(employees)
        .leftJoin(
          camera_safety_violations,
          sql`${camera_safety_violations.employee_id} = ${employees.id}::text`,
        )
        .where(cond)
        .groupBy(employees.id, sql`"employees"."full_name"`, sql`"employees"."department_id"`)
        .orderBy(sql`6 DESC`)
        .limit(limit);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }
}

export type CameraRecognitionLogRow = Awaited<ReturnType<DrizzleCameraRepo['findRecognitionLogs']>>['data'] extends (infer R)[] | undefined ? R : never;
export type CameraAlertRow = Awaited<ReturnType<DrizzleCameraRepo['findCameraAlerts']>>['data'] extends (infer R)[] | undefined ? R : never;
export type CameraListRow = Awaited<ReturnType<DrizzleCameraRepo['listCameras']>>['data'] extends (infer R)[] | undefined ? R : never;
export type QualityDefectRow = Awaited<ReturnType<DrizzleCameraRepo['findQualityDefects']>>['data'] extends (infer R)[] | undefined ? R : never;
export type EmployeeRatingRow = Awaited<ReturnType<DrizzleCameraRepo['findEmployeeRatings']>>['data'] extends (infer R)[] | undefined ? R : never;
