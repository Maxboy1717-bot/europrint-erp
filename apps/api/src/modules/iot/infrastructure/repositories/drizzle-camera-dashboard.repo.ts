/**
 * @module drizzle-camera-dashboard.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { desc, count, eq, and, gte, lte, inArray, sql } from 'drizzle-orm';
import {
  db, cameras, camera_events, camera_alerts, camera_zones,
  camera_safety_violations, camera_quality_defects, employees,
} from '@shared/db';
import { Ok, Err } from '@common/result';

import { MS_PER_DAY } from '@common/constants/app.constants';
@Injectable()
export class DrizzleCameraDashboardRepo {
  async findStats() {
    try {
      const [cam] = await db.select({
        total_cameras: count(cameras.id),
        active_cameras: sql<number>`COUNT(*) FILTER (WHERE ${cameras.is_active} = true)`,
      }).from(cameras);
      const [al] = await db.select({
        open_alerts: sql<number>`COUNT(*) FILTER (WHERE NOT ${camera_alerts.is_resolved})`,
      }).from(camera_alerts);
      const [vi] = await db.select({
        open_violations: sql<number>`COUNT(*) FILTER (WHERE ${camera_safety_violations.status} = 'open')`,
      }).from(camera_safety_violations);
      const [de] = await db.select({
        open_defects: sql<number>`COUNT(*) FILTER (WHERE ${camera_quality_defects.status} = 'open')`,
      }).from(camera_quality_defects);
      const since24h = new Date(Date.now() - MS_PER_DAY);
      const [ev] = await db.select({
        events_today: count(camera_events.id),
        recognitions_today: sql<number>`COUNT(*) FILTER (WHERE ${camera_events.event_type} = 'face_recognition')`,
      }).from(camera_events).where(gte(camera_events.created_at, since24h));
      return Ok({ ...cam, ...al, ...vi, ...de, ...ev });
    } catch (e) { return Err((e as Error).message); }
  }

  async findPendingAlerts(limit: number) {
    try {
      const rows = await db.select({
        id: camera_events.id, camera_id: camera_events.camera_id, event_type: camera_events.event_type,
        description: camera_events.description, severity: camera_events.severity, status: camera_events.status,
        created_at: camera_events.created_at, camera_name: cameras.name, location: cameras.location,
      }).from(camera_events)
        .leftJoin(cameras, eq(cameras.id, camera_events.camera_id))
        .where(and(eq(camera_events.status, 'new'), inArray(camera_events.severity, ['high', 'critical'])))
        .orderBy(desc(camera_events.created_at)).limit(limit);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findRecentEvents(limit: number, type: string | undefined) {
    try {
      const cond = type ? eq(camera_events.event_type, type) : undefined;
      const rows = await db.select({
        id: camera_events.id, camera_id: camera_events.camera_id, event_type: camera_events.event_type,
        description: camera_events.description, severity: camera_events.severity, status: camera_events.status,
        created_at: camera_events.created_at, camera_name: cameras.name, location: cameras.location,
      }).from(camera_events)
        .leftJoin(cameras, eq(cameras.id, camera_events.camera_id))
        .where(cond).orderBy(desc(camera_events.created_at)).limit(limit);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findTopEmployees(limit: number) {
    try {
      const since30d = new Date(Date.now() - 30 * MS_PER_DAY);
      const rows = await db.select({
        id: employees.id,
        full_name: sql<string>`COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')`,
        violations_count: sql<number>`COUNT(${camera_safety_violations.id})`,
        score: sql<number>`ROUND((100.0 - LEAST(COUNT(${camera_safety_violations.id})::float * 5, 100))::numeric, 1)`,
      }).from(employees)
        .leftJoin(camera_safety_violations, and(
          sql`${camera_safety_violations.employee_id} = ${employees.id}::text`,
          gte(camera_safety_violations.detected_at, since30d),
        ))
        .where(eq(employees.status, 'active'))
        .groupBy(employees.id, sql`COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')`)
        .orderBy(sql`4 DESC`).limit(limit);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findQualityStats() {
    try {
      const rows = await db.select({
        defect_type: camera_quality_defects.defect_type, severity: camera_quality_defects.severity,
        defect_count: count(camera_quality_defects.id),
        resolved_count: sql<number>`COUNT(*) FILTER (WHERE ${camera_quality_defects.status} = 'resolved')`,
        open_count: sql<number>`COUNT(*) FILTER (WHERE ${camera_quality_defects.status} = 'open')`,
      }).from(camera_quality_defects)
        .where(gte(camera_quality_defects.created_at, new Date(Date.now() - 30 * MS_PER_DAY)))
        .groupBy(camera_quality_defects.defect_type, camera_quality_defects.severity)
        .orderBy(sql`3 DESC`);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findAttendanceStats() {
    try {
      const rows = await db.select({
        day: sql<string>`DATE_TRUNC('day', ${camera_events.created_at})`,
        recognitions: sql<number>`COUNT(*) FILTER (WHERE ${camera_events.event_type} = 'face_recognition')`,
        active_cameras: sql<number>`COUNT(DISTINCT ${camera_events.camera_id})`,
      }).from(camera_events)
        .where(gte(camera_events.created_at, new Date(Date.now() - 30 * MS_PER_DAY)))
        .groupBy(sql`DATE_TRUNC('day', ${camera_events.created_at})`)
        .orderBy(sql`1 ASC`);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findSafetyStats() {
    try {
      const rows = await db.select({
        violation_type: camera_safety_violations.violation_type, severity: camera_safety_violations.severity,
        total: count(camera_safety_violations.id),
        resolved: sql<number>`COUNT(*) FILTER (WHERE ${camera_safety_violations.status} = 'resolved')`,
        open: sql<number>`COUNT(*) FILTER (WHERE ${camera_safety_violations.status} = 'open')`,
        last_7_days: sql<number>`COUNT(*) FILTER (WHERE ${camera_safety_violations.detected_at} >= NOW() - INTERVAL '7 days')`,
      }).from(camera_safety_violations)
        .groupBy(camera_safety_violations.violation_type, camera_safety_violations.severity)
        .orderBy(sql`3 DESC`);
      return Ok({ violations: rows });
    } catch (e) { return Err((e as Error).message); }
  }

  async findWeeklyTrend() {
    try {
      const rows = await db.select({
        day: sql<string>`DATE_TRUNC('day', ${camera_events.created_at})`,
        total_events: count(camera_events.id),
        recognitions: sql<number>`COUNT(*) FILTER (WHERE ${camera_events.event_type} = 'face_recognition')`,
        high_severity: sql<number>`COUNT(*) FILTER (WHERE ${camera_events.severity} IN ('high','critical'))`,
      }).from(camera_events)
        .where(gte(camera_events.created_at, new Date(Date.now() - 7 * MS_PER_DAY)))
        .groupBy(sql`DATE_TRUNC('day', ${camera_events.created_at})`)
        .orderBy(sql`1 ASC`);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findProductionStats() {
    try {
      const since24h = new Date(Date.now() - MS_PER_DAY);
      const rows = await db.select({
        event_type: camera_events.event_type, camera_name: cameras.name, location: cameras.location,
        total: count(camera_events.id),
        in_last_24h: sql<number>`COUNT(*) FILTER (WHERE ${camera_events.created_at} >= ${since24h})`,
      }).from(camera_events)
        .leftJoin(cameras, eq(cameras.id, camera_events.camera_id))
        .groupBy(camera_events.event_type, cameras.name, cameras.location)
        .orderBy(sql`4 DESC`).limit(50);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findHeatmapData(zoneId: string | undefined, targetDate: string) {
    try {
      const start = new Date(targetDate + 'T00:00:00.000Z');
      const end = new Date(targetDate + 'T23:59:59.999Z');
      const conds = [gte(camera_events.created_at, start), lte(camera_events.created_at, end)];
      if (zoneId) conds.push(eq(camera_zones.id, parseInt(zoneId, 10)));
      const rows = await db.select({
        hour: sql<number>`EXTRACT(HOUR FROM ${camera_events.created_at})`,
        zone_name: camera_zones.zone_name,
        event_count: count(camera_events.id),
        recognition_count: sql<number>`COUNT(*) FILTER (WHERE ${camera_events.event_type} = 'face_recognition')`,
      }).from(camera_events)
        .leftJoin(cameras, eq(cameras.id, camera_events.camera_id))
        .leftJoin(camera_zones, eq(camera_zones.camera_id, cameras.id))
        .where(and(...conds))
        .groupBy(sql`EXTRACT(HOUR FROM ${camera_events.created_at})`, camera_zones.zone_name)
        .orderBy(sql`1 ASC`);
      return Ok({ date: targetDate, zone_id: zoneId ?? null, heatmap: rows });
    } catch (e) { return Err((e as Error).message); }
  }

  async findHeatmapEmployees(limit: number) {
    try {
      const since30d = new Date(Date.now() - 30 * MS_PER_DAY);
      const rows = await db.select({
        id: employees.id,
        full_name: sql<string>`COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')`,
        recognitions_30d: sql<number>`COUNT(${camera_events.id}) FILTER (WHERE ${camera_events.created_at} >= ${since30d})`,
        last_seen: sql<string>`MAX(${camera_events.created_at})`,
      }).from(employees)
        .leftJoin(camera_events, sql`${camera_events.description} = ${employees.id}::text AND ${camera_events.event_type} = 'face_recognition'`)
        .where(eq(employees.status, 'active'))
        .groupBy(employees.id, sql`COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')`)
        .orderBy(sql`3 DESC`).limit(limit);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findHeatmapEmployee(id: string) {
    try {
      const [emp] = await db.select({
        id: employees.id,
        full_name: sql<string>`COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')`,
        status: employees.status,
      }).from(employees).where(eq(employees.id, id)).limit(1);
      if (!emp) return Ok(null);
      const since30d = new Date(Date.now() - 30 * MS_PER_DAY);
      const events = await db.select({
        id: camera_events.id, event_type: camera_events.event_type, camera_id: camera_events.camera_id,
        severity: camera_events.severity, created_at: camera_events.created_at,
        camera_name: cameras.name, location: cameras.location,
      }).from(camera_events)
        .leftJoin(cameras, eq(cameras.id, camera_events.camera_id))
        .where(and(
          eq(camera_events.event_type, 'face_recognition'),
          sql`${camera_events.description} = ${emp.id}::text`,
          gte(camera_events.created_at, since30d),
        ))
        .orderBy(desc(camera_events.created_at)).limit(100);
      return Ok({ employee: emp, recent_events: events });
    } catch (e) { return Err((e as Error).message); }
  }

  async generateReport(from: string, to: string) {
    try {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const rows = await db.select({
        camera: cameras.name, location: cameras.location,
        total_events: sql<number>`COUNT(DISTINCT ${camera_events.id})`,
        violations: sql<number>`COUNT(DISTINCT ${camera_safety_violations.id})`,
        defects: sql<number>`COUNT(DISTINCT ${camera_quality_defects.id})`,
      }).from(cameras)
        .leftJoin(camera_events, and(
          eq(cameras.id, camera_events.camera_id),
          gte(camera_events.created_at, fromDate), lte(camera_events.created_at, toDate),
        ))
        .leftJoin(camera_safety_violations, and(
          sql`${cameras.id}::text = ${camera_safety_violations.camera_id}`,
          gte(camera_safety_violations.detected_at, fromDate), lte(camera_safety_violations.detected_at, toDate),
        ))
        .leftJoin(camera_quality_defects, and(
          sql`${cameras.id}::text = ${camera_quality_defects.camera_id}`,
          gte(camera_quality_defects.detected_at, fromDate), lte(camera_quality_defects.detected_at, toDate),
        ))
        .groupBy(cameras.id, cameras.name, cameras.location)
        .orderBy(sql`3 DESC`);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }
}
