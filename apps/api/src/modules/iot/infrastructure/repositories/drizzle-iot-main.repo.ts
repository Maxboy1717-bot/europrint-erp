import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { sql, eq, and, gte, desc, count, inArray } from 'drizzle-orm';
import {
  db, runQuery,
  cameras, camera_events, camera_zones,
  camera_safety_violations, camera_quality_defects, employees,
} from '@shared/db';
import { Ok, Err } from '@common/result';

import { MS_PER_DAY, MS_PER_HOUR } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class DrizzleIotMainRepo {
  async findAlerts(status: string | undefined, severity: string | undefined, limit: number) {
    try {
      const conds: string[] = ['1=1'];
      const params: (string | number | boolean)[] = [];
      const q = status === 'active' ? sql`SELECT a.id, a.sensor_id, a.alert_type, a.severity, a.message, a.value, a.threshold, a.is_resolved, a.resolved_at, a.created_at, s.name AS sensor_name, s.location, s.type, s.unit FROM iot_alerts a LEFT JOIN iot_sensors s ON s.id = a.sensor_id WHERE a.is_resolved = false ${severity ? sql`AND a.severity = ${severity}` : sql``} ORDER BY a.created_at DESC LIMIT ${limit}`
        : status === 'resolved' ? sql`SELECT a.id, a.sensor_id, a.alert_type, a.severity, a.message, a.value, a.threshold, a.is_resolved, a.resolved_at, a.created_at, s.name AS sensor_name, s.location, s.type, s.unit FROM iot_alerts a LEFT JOIN iot_sensors s ON s.id = a.sensor_id WHERE a.is_resolved = true ${severity ? sql`AND a.severity = ${severity}` : sql``} ORDER BY a.created_at DESC LIMIT ${limit}`
        : severity ? sql`SELECT a.id, a.sensor_id, a.alert_type, a.severity, a.message, a.value, a.threshold, a.is_resolved, a.resolved_at, a.created_at, s.name AS sensor_name, s.location, s.type, s.unit FROM iot_alerts a LEFT JOIN iot_sensors s ON s.id = a.sensor_id WHERE a.severity = ${severity} ORDER BY a.created_at DESC LIMIT ${limit}`
        : sql`SELECT a.id, a.sensor_id, a.alert_type, a.severity, a.message, a.value, a.threshold, a.is_resolved, a.resolved_at, a.created_at, s.name AS sensor_name, s.location, s.type, s.unit FROM iot_alerts a LEFT JOIN iot_sensors s ON s.id = a.sensor_id ORDER BY a.created_at DESC LIMIT ${limit}`;
      return Ok(await exec(q));
    } catch (e) { return Err((e as Error).message); }
  }

  async acknowledgeAlert(id: string) {
    try {
      const result = await exec(sql`UPDATE iot_alerts SET is_resolved = true, resolved_at = NOW() WHERE id = ${id} RETURNING id, sensor_id, alert_type, severity, message, value, threshold, is_resolved, resolved_at, created_at`);
      return Ok(result[0] ?? { id, is_resolved: true });
    } catch (e) { return Err((e as Error).message); }
  }

  async findMachinesCurrent() {
    try {
      const result = await exec(sql`SELECT id, sensor_code, name, type, location, unit, is_active, min_threshold, max_threshold, last_reading, last_reading_at, CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status FROM iot_sensors WHERE type IN ('machine', 'production', 'equipment') ORDER BY name LIMIT 100`);
      if (result.length) return Ok(result);
      const all = await exec(sql`SELECT id, sensor_code, name, type, is_active, created_at, CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status FROM iot_sensors ORDER BY name LIMIT 20`);
      return Ok(all);
    } catch (e) { return Err((e as Error).message); }
  }

  async findMachineLogs(deviceId: string | undefined, limit: number) {
    try {
      const result = deviceId
        ? await exec(sql`SELECT r.id, r.sensor_id, r.value, r.status, r.recorded_at, s.name AS sensor_name, s.type, s.location, s.unit FROM iot_sensor_readings r LEFT JOIN iot_sensors s ON s.id = r.sensor_id WHERE r.sensor_id = ${deviceId} ORDER BY r.recorded_at DESC LIMIT ${limit}`)
        : await exec(sql`SELECT r.id, r.sensor_id, r.value, r.status, r.recorded_at, s.name AS sensor_name, s.type, s.location, s.unit FROM iot_sensor_readings r LEFT JOIN iot_sensors s ON s.id = r.sensor_id ORDER BY r.recorded_at DESC LIMIT ${limit}`);
      return Ok(result);
    } catch (e) { return Err((e as Error).message); }
  }

  async findEnvironmentData(deviceType: string | undefined, location: string | undefined, deviceId: string | undefined) {
    try {
      const result = await exec(
        deviceType && location && deviceId ? sql`SELECT id, sensor_code, name, type, location, unit, is_active, last_reading, last_reading_at, CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status FROM iot_sensors WHERE type = ${deviceType} AND location ILIKE ${'%' + location + '%'} AND id = ${deviceId} ORDER BY name LIMIT 50`
        : deviceType && location ? sql`SELECT id, sensor_code, name, type, location, unit, is_active, last_reading, last_reading_at, CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status FROM iot_sensors WHERE type = ${deviceType} AND location ILIKE ${'%' + location + '%'} ORDER BY name LIMIT 50`
        : deviceType ? sql`SELECT id, sensor_code, name, type, location, unit, is_active, last_reading, last_reading_at, CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status FROM iot_sensors WHERE type = ${deviceType} ORDER BY name LIMIT 50`
        : deviceId ? sql`SELECT id, sensor_code, name, type, location, unit, is_active, last_reading, last_reading_at, CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status FROM iot_sensors WHERE id = ${deviceId} ORDER BY name LIMIT 50`
        : sql`SELECT id, sensor_code, name, type, location, unit, is_active, last_reading, last_reading_at, CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status FROM iot_sensors ORDER BY name LIMIT 50`
      );
      return Ok(result);
    } catch (e) { return Err((e as Error).message); }
  }

  async findDeviceStats(deviceId: string) {
    try {
      const sensorRows = await exec(sql`SELECT * FROM iot_sensors WHERE id = ${deviceId} LIMIT 1`);
      if (!sensorRows.length) return Ok(null);
      const statsRows = await exec(sql`SELECT ROUND(AVG(value::float)::numeric, 2) AS avg_value, ROUND(MAX(value::float)::numeric, 2) AS max_value, ROUND(MIN(value::float)::numeric, 2) AS min_value, COUNT(*) AS total_readings FROM iot_sensor_readings WHERE sensor_id = ${deviceId} AND recorded_at >= NOW() - INTERVAL '24 hours'`);
      return Ok({ ...sensorRows[0], ...statsRows[0] });
    } catch (e) { return Err((e as Error).message); }
  }

  async findAttendanceLive() {
    try {
      const since = new Date(Date.now() - MS_PER_HOUR);
      const live = await db.select({
        id: employees.id,
        full_name: sql<string>`COALESCE("employees"."first_name", '') || ' ' || COALESCE("employees"."last_name", '')`,
        department_id: sql<number>`"employees"."department_id"`,
        last_seen: camera_events.created_at, camera_name: cameras.name, location: cameras.location,
      }).from(camera_events)
        .innerJoin(cameras, sql`${cameras.id}::text = ${camera_events.camera_id}`)
        .innerJoin(employees, sql`${employees.id}::text = ${camera_events.description}`)
        .where(and(eq(camera_events.event_type, 'face_recognition'), gte(camera_events.created_at, since)))
        .orderBy(desc(camera_events.created_at)).limit(100);
      if (live.length) return Ok({ present_count: live.length, employees: live, timestamp: _time.now().toISOString() });
      const fallback = await db.select({
        id: employees.id,
        full_name: sql<string>`COALESCE("employees"."first_name", '') || ' ' || COALESCE("employees"."last_name", '')`,
        department_id: sql<number>`"employees"."department_id"`,
      })
        .from(employees).where(eq(employees.status, 'active')).limit(20);
      return Ok({ present_count: 0, employees: fallback, timestamp: _time.now().toISOString() });
    } catch (e) { return Err((e as Error).message); }
  }

  async findRoomInspections(status: string | undefined, limit: number) {
    try {
      const conds = [inArray(camera_events.event_type, ['room_inspection', 'zone_inspection', 'safety_check'])];
      if (status) conds.push(eq(camera_events.status, status));
      const rows = await db.select({
        id: camera_events.id, camera_id: camera_events.camera_id, event_type: camera_events.event_type,
        description: camera_events.description, severity: camera_events.severity, status: camera_events.status,
        created_at: camera_events.created_at, camera_name: cameras.name, location: cameras.location,
        zone_name: camera_zones.zone_name, zone_type: camera_zones.zone_type,
      }).from(camera_events)
        .leftJoin(cameras, sql`${cameras.id}::text = ${camera_events.camera_id}`)
        .leftJoin(camera_zones, eq(camera_zones.camera_id, cameras.id))
        .where(and(...conds)).orderBy(desc(camera_events.created_at)).limit(limit);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findEmployeeHealth(employeeId: string | undefined, limit: number) {
    try {
      const cond = employeeId ? sql`${employees.id}::text = ${employeeId}` : eq(employees.status, 'active');
      const since = new Date(Date.now() - 30 * MS_PER_DAY);
      const rows = await db.select({
        id: employees.id,
        full_name: sql<string>`COALESCE("employees"."first_name", '') || ' ' || COALESCE("employees"."last_name", '')`,
        department_id: sql<number>`"employees"."department_id"`,
        recent_violations: sql<number>`COUNT(${camera_safety_violations.id}) FILTER (WHERE ${camera_safety_violations.detected_at} >= ${since})`,
        last_violation_date: sql<string>`MAX(${camera_safety_violations.detected_at})`,
      }).from(employees)
        .leftJoin(camera_safety_violations, sql`${camera_safety_violations.employee_id} = ${employees.id}::text`)
        .where(cond).groupBy(employees.id, sql`"employees"."first_name"`, sql`"employees"."last_name"`, sql`"employees"."department_id"`)
        .orderBy(sql`4 DESC`).limit(limit);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findSafetyViolations(status: string | undefined, severity: string | undefined, limit: number) {
    try {
      const conds = [];
      if (status) conds.push(eq(camera_safety_violations.status, status));
      if (severity) conds.push(eq(camera_safety_violations.severity, severity));
      const rows = await db.select({
        id: camera_safety_violations.id, camera_id: camera_safety_violations.camera_id,
        violation_type: camera_safety_violations.violation_type, severity: camera_safety_violations.severity,
        status: camera_safety_violations.status, description: camera_safety_violations.description,
        employee_id: camera_safety_violations.employee_id, detected_at: camera_safety_violations.detected_at,
        camera_name: cameras.name, location: cameras.location,
        employee_name: sql<string>`COALESCE("employees"."first_name", '') || ' ' || COALESCE("employees"."last_name", '')`,
      }).from(camera_safety_violations)
        .leftJoin(cameras, sql`${cameras.id}::text = ${camera_safety_violations.camera_id}`)
        .leftJoin(employees, sql`${employees.id}::text = ${camera_safety_violations.employee_id}`)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(camera_safety_violations.detected_at)).limit(limit);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findEmployeeProductivity(departmentId: string | undefined, limit: number) {
    try {
      const since = new Date(Date.now() - 30 * MS_PER_DAY);
      const conds = [eq(employees.status, 'active')];
      if (departmentId) conds.push(sql`"employees"."department_id"::text = ${departmentId}`);
      const rows = await db.select({
        id: employees.id,
        full_name: sql<string>`COALESCE("employees"."first_name", '') || ' ' || COALESCE("employees"."last_name", '')`,
        department_id: sql<number>`"employees"."department_id"`,
        violations_30d: sql<number>`COUNT(DISTINCT ${camera_safety_violations.id}) FILTER (WHERE ${camera_safety_violations.detected_at} >= ${since})`,
        recognitions_30d: sql<number>`COUNT(DISTINCT ${camera_events.id}) FILTER (WHERE ${camera_events.event_type} = 'face_recognition' AND ${camera_events.created_at} >= ${since})`,
        productivity_score: sql<number>`ROUND((100.0 - LEAST(COUNT(DISTINCT ${camera_safety_violations.id})::float * 5, 100))::numeric, 1)`,
      }).from(employees)
        .leftJoin(camera_safety_violations, sql`${camera_safety_violations.employee_id} = ${employees.id}::text`)
        .leftJoin(camera_events, sql`${camera_events.description} ILIKE '%' || ${employees.id}::text || '%'`)
        .where(and(...conds)).groupBy(employees.id, sql`"employees"."first_name"`, sql`"employees"."last_name"`, sql`"employees"."department_id"`)
        .orderBy(sql`6 DESC`).limit(limit);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findQualityDefects(status: string | undefined, cameraId: string | undefined, limit: number) {
    try {
      const conds = [];
      if (status) conds.push(eq(camera_quality_defects.status, status));
      if (cameraId) conds.push(eq(camera_quality_defects.camera_id, cameraId));
      const rows = await db.select({
        id: camera_quality_defects.id, camera_id: camera_quality_defects.camera_id,
        defect_type: camera_quality_defects.defect_type, severity: camera_quality_defects.severity,
        status: camera_quality_defects.status, description: camera_quality_defects.description,
        detected_at: camera_quality_defects.detected_at, resolved_at: camera_quality_defects.resolved_at,
        camera_name: cameras.name, location: cameras.location,
      }).from(camera_quality_defects)
        .leftJoin(cameras, sql`${cameras.id}::text = ${camera_quality_defects.camera_id}`)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(camera_quality_defects.detected_at)).limit(limit);
      return Ok(rows);
    } catch (e) { return Err((e as Error).message); }
  }

  async findRecognitionStats() {
    try {
      const since24h = new Date(Date.now() - MS_PER_DAY);
      const since1h = new Date(Date.now() - MS_PER_HOUR);
      const [summary] = await db.select({
        recognitions_24h: sql<number>`COUNT(*) FILTER (WHERE ${camera_events.event_type} = 'face_recognition' AND ${camera_events.created_at} >= ${since24h})`,
        recognitions_last_hour: sql<number>`COUNT(*) FILTER (WHERE ${camera_events.event_type} = 'face_recognition' AND ${camera_events.created_at} >= ${since1h})`,
      }).from(camera_events);
      const [camCount] = await db.select({ active_cameras: count(cameras.id) })
        .from(cameras).where(eq(cameras.is_active, true));
      const byCamera = await db.select({
        id: cameras.id, name: cameras.name, location: cameras.location,
        total_recognitions: sql<number>`COUNT(${camera_events.id}) FILTER (WHERE ${camera_events.event_type} = 'face_recognition')`,
        recognitions_24h: sql<number>`COUNT(${camera_events.id}) FILTER (WHERE ${camera_events.event_type} = 'face_recognition' AND ${camera_events.created_at} >= ${since24h})`,
      }).from(cameras)
        .leftJoin(camera_events, sql`${cameras.id}::text = ${camera_events.camera_id}`)
        .where(eq(cameras.is_active, true)).groupBy(cameras.id, cameras.name, cameras.location)
        .orderBy(sql`5 DESC`);
      return Ok({ summary: { ...summary, ...camCount }, by_camera: byCamera });
    } catch (e) { return Err((e as Error).message); }
  }

  async findDashboard() {
    try {
      const [sensorResult, readingResult, cameraCounts, violCounts] = await Promise.all([
        exec(sql`SELECT COUNT(*) AS total_devices, COUNT(*) FILTER (WHERE is_active = true) AS active_devices FROM iot_sensors`),
        exec(sql`SELECT COUNT(*) FILTER (WHERE recorded_at >= NOW() - INTERVAL '1 hour') AS readings_last_hour FROM iot_sensor_readings`),
        db.select({
          active_cameras: sql<number>`COUNT(*) FILTER (WHERE ${cameras.is_active} = true)`,
          open_events:    sql<number>`0`,
        }).from(cameras),
        db.select({
          open_violations: sql<number>`COUNT(*) FILTER (WHERE ${camera_safety_violations.status} = 'open')`,
        }).from(camera_safety_violations),
      ]);
      return Ok({ ...sensorResult[0], ...readingResult[0], ...cameraCounts[0], ...violCounts[0] });
    } catch (e) { return Err((e as Error).message); }
  }
}
