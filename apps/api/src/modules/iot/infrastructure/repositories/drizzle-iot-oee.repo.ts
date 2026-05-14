/**
 * @module drizzle-iot-oee.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { sql, eq, and, gte, inArray, count } from 'drizzle-orm';
import { db, camera_events, camera_safety_violations, camera_quality_defects , runQuery } from '@shared/db';
import { Ok, Err, Result } from '@common/result';

import { MS_PER_HOUR } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class DrizzleIotOeeRepo {
  async findOee(deviceId: string | undefined, days: number): Promise<Result<Row>> {
    try {
      const since = new Date(Date.now() - days * 86_400_000);
      const devices = deviceId
        ? await exec(sql`SELECT s.id, s.sensor_code, s.name, s.type, s.location, s.unit, COUNT(r.id) AS total_readings, COUNT(r.id) FILTER (WHERE r.value::float > 0) AS active_readings, ROUND((COUNT(r.id) FILTER (WHERE r.value::float > 80))::float::numeric / GREATEST(COUNT(r.id), 1) * 100, 1) AS availability_pct, ROUND((AVG(r.value::float) FILTER (WHERE r.value::float > 0))::numeric, 2) AS avg_efficiency, ROUND(((COUNT(r.id) FILTER (WHERE r.value::float > 80))::float / GREATEST(COUNT(r.id), 1) * COALESCE(AVG(CASE WHEN r.value::float > 0 THEN r.value::float END), 0) / 100)::numeric, 2) AS oee FROM iot_sensors s LEFT JOIN iot_sensor_readings r ON r.sensor_id = s.id AND r.recorded_at >= ${since} WHERE s.type IN ('machine', 'production', 'equipment') AND s.id = ${deviceId} GROUP BY s.id, s.sensor_code, s.name, s.type, s.location, s.unit ORDER BY oee DESC NULLS LAST`)
        : await exec(sql`SELECT s.id, s.sensor_code, s.name, s.type, s.location, s.unit, COUNT(r.id) AS total_readings, COUNT(r.id) FILTER (WHERE r.value::float > 0) AS active_readings, ROUND((COUNT(r.id) FILTER (WHERE r.value::float > 80))::float::numeric / GREATEST(COUNT(r.id), 1) * 100, 1) AS availability_pct, ROUND((AVG(r.value::float) FILTER (WHERE r.value::float > 0))::numeric, 2) AS avg_efficiency, ROUND(((COUNT(r.id) FILTER (WHERE r.value::float > 80))::float / GREATEST(COUNT(r.id), 1) * COALESCE(AVG(CASE WHEN r.value::float > 0 THEN r.value::float END), 0) / 100)::numeric, 2) AS oee FROM iot_sensors s LEFT JOIN iot_sensor_readings r ON r.sensor_id = s.id AND r.recorded_at >= ${since} WHERE s.type IN ('machine', 'production', 'equipment') GROUP BY s.id, s.sensor_code, s.name, s.type, s.location, s.unit ORDER BY oee DESC NULLS LAST`);
      return Ok({ period_days: days, devices });
    } catch (e) { return Err((e as Error).message); }
  }

  async findProductionMetrics(): Promise<Result<Row>> {
    try {
      const since8h = new Date(Date.now() - 8 * MS_PER_HOUR);
      const [machineRows, readingRows, eventCount, violCount, defectCount] = await Promise.all([
        exec(sql`SELECT COUNT(*) FILTER (WHERE is_active = true) AS active_machines FROM iot_sensors WHERE type IN ('machine', 'production', 'equipment')`),
        exec(sql`SELECT ROUND(AVG(value::float)::numeric, 2) AS avg_output_8h FROM iot_sensor_readings WHERE recorded_at >= ${since8h}`),
        db.select({ production_events_8h: count(camera_events.id) }).from(camera_events).where(and(inArray(camera_events.event_type, ['production_start', 'production_stop']), gte(camera_events.created_at, since8h))),
        db.select({ safety_violations_8h: count(camera_safety_violations.id) }).from(camera_safety_violations).where(gte(camera_safety_violations.detected_at, since8h)),
        db.select({ quality_defects_8h: count(camera_quality_defects.id) }).from(camera_quality_defects).where(gte(camera_quality_defects.detected_at, since8h)),
      ]);
      return Ok({ ...machineRows[0], ...readingRows[0], ...eventCount[0], ...violCount[0], ...defectCount[0] } as Row);
    } catch (e) { return Err((e as Error).message); }
  }

  async findShiftReport(targetDate: string, endDate: string): Promise<Result<Row>> {
    try {
      const between = (col: Parameters<typeof gte>[0]) => sql`${col} BETWEEN ${targetDate}::timestamptz AND ${endDate}::timestamptz`;
      const [totalEvents, safetyViol, qualDef, empPresent, readingRows] = await Promise.all([
        db.select({ total_events: count(camera_events.id) }).from(camera_events).where(between(camera_events.created_at)),
        db.select({ safety_violations: count(camera_safety_violations.id) }).from(camera_safety_violations).where(between(camera_safety_violations.detected_at)),
        db.select({ quality_defects: count(camera_quality_defects.id) }).from(camera_quality_defects).where(between(camera_quality_defects.detected_at)),
        db.select({ employees_present: sql<number>`COUNT(DISTINCT ${camera_events.description})` }).from(camera_events).where(and(eq(camera_events.event_type, 'face_recognition'), between(camera_events.created_at))),
        exec(sql`SELECT COUNT(*) AS total_readings FROM iot_sensor_readings WHERE recorded_at BETWEEN ${targetDate}::timestamptz AND ${endDate}::timestamptz`),
      ]);
      return Ok({ ...totalEvents[0], ...safetyViol[0], ...qualDef[0], ...empPresent[0], ...readingRows[0] } as Row);
    } catch (e) { return Err((e as Error).message); }
  }
}
