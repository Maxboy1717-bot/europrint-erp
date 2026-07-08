/**
 * @module drizzle-iot-oee.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { SQL, SQLWrapper, and, count, eq, gte, inArray, sql } from 'drizzle-orm';
import { db, camera_events, camera_safety_violations, camera_quality_defects , runQuery } from '@shared/db';
import { Ok, Err, Result } from '@common/result';

import { MS_PER_HOUR } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class DrizzleIotOeeRepo {
  /**
   * EP-IOT-014 fix: Availability used to be a sensor-reading proxy
   * (`iot_sensor_readings.value::float > 80` share of readings) — a made-up
   * threshold with no relationship to real machine uptime. `production_sessions`
   * now carries the real GSD timing columns (verified live via information_schema,
   * 2026-07-07: running_time_seconds, stopped_time_seconds, setup_seconds all
   * `integer`, present on every row), so Availability is computed from those:
   *
   *   Availability = (running_time_seconds − stopped_time_seconds − setup_seconds)
   *                  / NULLIF(running_time_seconds − stopped_time_seconds, 0)
   *
   * i.e. of the net time the machine was actually running (stops already
   * removed), what share was productive main-run vs. GSD setup/changeover.
   * NULLIF guards divide-by-zero → NULL (never a fabricated 100%/NaN), mapped
   * to 0 below (Qoida 2 — never surface NaN).
   *
   * Grouped by work-center: production_sessions.work_center_id (text) is
   * unpopulated (0 rows, confirmed live), so the real grouping key is the
   * equipment → work_centers chain (production_sessions.equipment_id →
   * equipment.id → equipment.work_center_id → work_centers.id — 6/7 equipment
   * rows have this FK populated, confirmed live).
   */
  async findOee(deviceId: string | undefined, days: number): Promise<Result<Row>> {
    try {
      const since = new Date(Date.now() - days * 86_400_000);
      const parsedDeviceId = deviceId !== undefined ? Number.parseInt(deviceId, 10) : undefined;
      const deviceFilter = parsedDeviceId !== undefined && Number.isFinite(parsedDeviceId)
        ? sql`AND e.id = ${parsedDeviceId}`
        : sql``;

      const rows = await exec(sql`
        SELECT
          wc.id                                                          AS work_center_id,
          COALESCE(wc.name, e.name)                                      AS work_center_name,
          COUNT(ps.id)                                                   AS session_count,
          COALESCE(SUM(ps.running_time_seconds), 0)                      AS running_time_seconds,
          COALESCE(SUM(ps.stopped_time_seconds), 0)                      AS stopped_time_seconds,
          COALESCE(SUM(ps.setup_seconds), 0)                             AS setup_seconds,
          ROUND(
            (
              (COALESCE(SUM(ps.running_time_seconds), 0)
                - COALESCE(SUM(ps.stopped_time_seconds), 0)
                - COALESCE(SUM(ps.setup_seconds), 0))::numeric
              / NULLIF(
                  COALESCE(SUM(ps.running_time_seconds), 0)
                    - COALESCE(SUM(ps.stopped_time_seconds), 0),
                  0
                )
            ) * 100,
            1
          )                                                               AS availability_pct
        FROM equipment e
        LEFT JOIN work_centers wc ON wc.id = e.work_center_id
        LEFT JOIN production_sessions ps
          ON ps.equipment_id = e.id
          AND ps.deleted_at IS NULL
          AND ps.started_at >= ${since}
        WHERE e.deleted_at IS NULL
        ${deviceFilter}
        GROUP BY wc.id, wc.name, e.name
        ORDER BY availability_pct DESC NULLS LAST
      `);

      const devices = rows.map((r) => ({
        ...r,
        availability_pct: Number(r.availability_pct ?? 0),
      }));

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
