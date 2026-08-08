/**
 * @module drizzle-iot-sensors.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';
import { Ok, Err } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class DrizzleIotSensorsRepo {
  async findDashboard() {
    try {
      const [s, a, oeeRows] = await Promise.all([
        exec(sql`SELECT COUNT(*) FILTER (WHERE is_active = true) AS "activeSensors", COUNT(*) FILTER (WHERE is_active = true AND type IN ('machine','production','equipment')) AS "machinesRunning" FROM iot_sensors`),
        exec(sql`SELECT COUNT(*) FILTER (WHERE is_resolved = false) AS "totalActiveAlerts", COUNT(*) FILTER (WHERE is_resolved = false AND severity = 'critical') AS "critical", COUNT(*) FILTER (WHERE is_resolved = false AND severity = 'high') AS "high", COUNT(*) FILTER (WHERE is_resolved = false AND severity = 'medium') AS "medium" FROM iot_alerts`),
        exec(sql`SELECT ROUND(AVG(oee)::numeric, 2) AS "avgOeeToday" FROM production_sessions WHERE deleted_at IS NULL AND (updated_at >= NOW() - INTERVAL '24 hours' OR status IN ('running', 'in_progress'))`),
      ]);
      return Ok({
        activeSensors: Number(s[0]?.['activeSensors'] ?? 0),
        totalActiveAlerts: Number(a[0]?.['totalActiveAlerts'] ?? 0),
        alertsBySeverity: {
          critical: Number(a[0]?.['critical'] ?? 0),
          high: Number(a[0]?.['high'] ?? 0),
          medium: Number(a[0]?.['medium'] ?? 0),
        },
        avgOeeToday: Number(oeeRows[0]?.['avgOeeToday'] ?? 0),
        machinesRunning: Number(s[0]?.['machinesRunning'] ?? 0),
      });
    } catch (e) { return Err((e as Error).message); }
  }

  async insertSensor(data: { name: string; type: string; location?: string; status?: string }) {
    try {
      const sensorCode = `SEN-${_time.now().getTime()}`;
      const rows = await exec(sql`
        INSERT INTO iot_sensors (sensor_code, name, type, location, status, is_active, created_at)
        VALUES (${sensorCode}, ${data.name}, ${data.type}, ${data.location ?? null}, ${data.status ?? 'active'}, true, NOW())
        RETURNING *
      `);
      return Ok(rows[0] ?? {});
    } catch (e) { return Err((e as Error).message); }
  }

  async findLiveReadings(type: string | undefined, location: string | undefined, limit: number) {
    try {
      const result = type && location
        ? await exec(sql`SELECT s.id, s.sensor_code, s.name, s.type, s.location, s.unit, s.is_active, s.min_threshold, s.max_threshold, r.value, r.status AS reading_status, r.recorded_at, CASE WHEN r.value::float > s.max_threshold::float THEN 'critical' WHEN r.value::float > s.min_threshold::float THEN 'warning' ELSE 'normal' END AS alert_level FROM iot_sensors s LEFT JOIN LATERAL (SELECT * FROM iot_sensor_readings WHERE sensor_id = s.id ORDER BY recorded_at DESC LIMIT 1) r ON true WHERE s.is_active = true AND s.type = ${type} AND s.location ILIKE ${'%' + location + '%'} ORDER BY r.recorded_at DESC NULLS LAST LIMIT ${limit}`)
        : type
        ? await exec(sql`SELECT s.id, s.sensor_code, s.name, s.type, s.location, s.unit, s.is_active, s.min_threshold, s.max_threshold, r.value, r.status AS reading_status, r.recorded_at, CASE WHEN r.value::float > s.max_threshold::float THEN 'critical' WHEN r.value::float > s.min_threshold::float THEN 'warning' ELSE 'normal' END AS alert_level FROM iot_sensors s LEFT JOIN LATERAL (SELECT * FROM iot_sensor_readings WHERE sensor_id = s.id ORDER BY recorded_at DESC LIMIT 1) r ON true WHERE s.is_active = true AND s.type = ${type} ORDER BY r.recorded_at DESC NULLS LAST LIMIT ${limit}`)
        : location
        ? await exec(sql`SELECT s.id, s.sensor_code, s.name, s.type, s.location, s.unit, s.is_active, s.min_threshold, s.max_threshold, r.value, r.status AS reading_status, r.recorded_at, CASE WHEN r.value::float > s.max_threshold::float THEN 'critical' WHEN r.value::float > s.min_threshold::float THEN 'warning' ELSE 'normal' END AS alert_level FROM iot_sensors s LEFT JOIN LATERAL (SELECT * FROM iot_sensor_readings WHERE sensor_id = s.id ORDER BY recorded_at DESC LIMIT 1) r ON true WHERE s.is_active = true AND s.location ILIKE ${'%' + location + '%'} ORDER BY r.recorded_at DESC NULLS LAST LIMIT ${limit}`)
        : await exec(sql`SELECT s.id, s.sensor_code, s.name, s.type, s.location, s.unit, s.is_active, s.min_threshold, s.max_threshold, r.value, r.status AS reading_status, r.recorded_at, CASE WHEN r.value::float > s.max_threshold::float THEN 'critical' WHEN r.value::float > s.min_threshold::float THEN 'warning' ELSE 'normal' END AS alert_level FROM iot_sensors s LEFT JOIN LATERAL (SELECT * FROM iot_sensor_readings WHERE sensor_id = s.id ORDER BY recorded_at DESC LIMIT 1) r ON true WHERE s.is_active = true ORDER BY r.recorded_at DESC NULLS LAST LIMIT ${limit}`);
      return Ok({ timestamp: _time.now().toISOString(), sensors: result });
    } catch (e) { return Err((e as Error).message); }
  }

  async findAlerts(severity: string | undefined, limit: number) {
    try {
      const result = severity
        ? await exec(sql`SELECT a.id, a.sensor_id, a.alert_type, a.severity, a.message, a.value, a.threshold, a.is_resolved, a.created_at, s.name AS sensor_name, s.location, s.type, s.unit FROM iot_alerts a LEFT JOIN iot_sensors s ON s.id = a.sensor_id WHERE a.is_resolved = false AND a.severity = ${severity} AND a.created_at >= NOW() - INTERVAL '1 hour' ORDER BY a.created_at DESC LIMIT ${limit}`)
        : await exec(sql`SELECT a.id, a.sensor_id, a.alert_type, a.severity, a.message, a.value, a.threshold, a.is_resolved, a.created_at, s.name AS sensor_name, s.location, s.type, s.unit FROM iot_alerts a LEFT JOIN iot_sensors s ON s.id = a.sensor_id WHERE a.is_resolved = false AND a.created_at >= NOW() - INTERVAL '1 hour' ORDER BY a.created_at DESC LIMIT ${limit}`);
      return Ok(result);
    } catch (e) { return Err((e as Error).message); }
  }

  async findOee(deviceId: string | undefined, days: number) {
    try {
      const since = new Date(Date.now() - days * 86_400_000);
      const result = deviceId
        ? await exec(sql`SELECT s.id, s.sensor_code, s.name, s.type, s.location, s.unit, COUNT(r.id) AS total_readings, ROUND(AVG(r.value::float)::numeric, 2) AS avg_efficiency, ROUND(MAX(r.value::float)::numeric, 2) AS peak_value, ROUND(MIN(r.value::float)::numeric, 2) AS min_value, COUNT(r.id) FILTER (WHERE r.value::float > 80) AS high_readings, ROUND((COUNT(r.id) FILTER (WHERE r.value::float > 80))::float::numeric / GREATEST(COUNT(r.id), 1) * 100, 1) AS oee_percentage FROM iot_sensors s LEFT JOIN iot_sensor_readings r ON r.sensor_id = s.id AND r.recorded_at >= ${since} WHERE s.id = ${deviceId} GROUP BY s.id, s.sensor_code, s.name, s.type, s.location, s.unit ORDER BY oee_percentage DESC NULLS LAST`)
        : await exec(sql`SELECT s.id, s.sensor_code, s.name, s.type, s.location, s.unit, COUNT(r.id) AS total_readings, ROUND(AVG(r.value::float)::numeric, 2) AS avg_efficiency, ROUND(MAX(r.value::float)::numeric, 2) AS peak_value, ROUND(MIN(r.value::float)::numeric, 2) AS min_value, COUNT(r.id) FILTER (WHERE r.value::float > 80) AS high_readings, ROUND((COUNT(r.id) FILTER (WHERE r.value::float > 80))::float::numeric / GREATEST(COUNT(r.id), 1) * 100, 1) AS oee_percentage FROM iot_sensors s LEFT JOIN iot_sensor_readings r ON r.sensor_id = s.id AND r.recorded_at >= ${since} GROUP BY s.id, s.sensor_code, s.name, s.type, s.location, s.unit ORDER BY oee_percentage DESC NULLS LAST`);
      return Ok({ period_days: days, sensors: result });
    } catch (e) { return Err((e as Error).message); }
  }

  async listSensors(type: string | undefined, status: string | undefined, offset: number, limit: number) {
    try {
      const [sensors, countRows] = await Promise.all([
        type && status === 'active' ? exec(sql`SELECT s.id, s.sensor_code, s.name, s.type, s.location, s.unit, s.is_active, s.min_threshold, s.max_threshold, s.created_at, CASE WHEN s.is_active THEN 'active' ELSE 'inactive' END AS status, r.value AS latest_value, r.recorded_at AS latest_reading FROM iot_sensors s LEFT JOIN LATERAL (SELECT * FROM iot_sensor_readings WHERE sensor_id = s.id ORDER BY recorded_at DESC LIMIT 1) r ON true WHERE s.type = ${type} AND s.is_active = true ORDER BY s.name LIMIT ${limit} OFFSET ${offset}`)
        : type && status === 'inactive' ? exec(sql`SELECT s.id, s.sensor_code, s.name, s.type, s.location, s.unit, s.is_active, s.min_threshold, s.max_threshold, s.created_at, CASE WHEN s.is_active THEN 'active' ELSE 'inactive' END AS status, r.value AS latest_value, r.recorded_at AS latest_reading FROM iot_sensors s LEFT JOIN LATERAL (SELECT * FROM iot_sensor_readings WHERE sensor_id = s.id ORDER BY recorded_at DESC LIMIT 1) r ON true WHERE s.type = ${type} AND s.is_active = false ORDER BY s.name LIMIT ${limit} OFFSET ${offset}`)
        : type ? exec(sql`SELECT s.id, s.sensor_code, s.name, s.type, s.location, s.unit, s.is_active, s.min_threshold, s.max_threshold, s.created_at, CASE WHEN s.is_active THEN 'active' ELSE 'inactive' END AS status, r.value AS latest_value, r.recorded_at AS latest_reading FROM iot_sensors s LEFT JOIN LATERAL (SELECT * FROM iot_sensor_readings WHERE sensor_id = s.id ORDER BY recorded_at DESC LIMIT 1) r ON true WHERE s.type = ${type} ORDER BY s.name LIMIT ${limit} OFFSET ${offset}`)
        : exec(sql`SELECT s.id, s.sensor_code, s.name, s.type, s.location, s.unit, s.is_active, s.min_threshold, s.max_threshold, s.created_at, CASE WHEN s.is_active THEN 'active' ELSE 'inactive' END AS status, r.value AS latest_value, r.recorded_at AS latest_reading FROM iot_sensors s LEFT JOIN LATERAL (SELECT * FROM iot_sensor_readings WHERE sensor_id = s.id ORDER BY recorded_at DESC LIMIT 1) r ON true ORDER BY s.name LIMIT ${limit} OFFSET ${offset}`),
        exec(sql`SELECT COUNT(*) AS total FROM iot_sensors`),
      ]);
      return Ok({ sensors, total: Number(countRows[0]?.total ?? 0) });
    } catch (e) { return Err((e as Error).message); }
  }

  async findSensorHistory(id: string, fromDate: string, toDate: string, limit: number) {
    try {
      const result = await exec(sql`SELECT r.id, r.value, r.status, r.recorded_at, s.name AS sensor_name, s.type, s.unit FROM iot_sensor_readings r LEFT JOIN iot_sensors s ON s.id = r.sensor_id WHERE r.sensor_id = ${id} AND r.recorded_at BETWEEN ${fromDate}::timestamptz AND ${toDate}::timestamptz ORDER BY r.recorded_at DESC LIMIT ${limit}`);
      return Ok(result);
    } catch (e) { return Err((e as Error).message); }
  }

  async findSensorTrends(type: string | undefined, hours: number) {
    try {
      const result = type
        ? await exec(sql`SELECT DATE_TRUNC('hour', r.recorded_at) AS hour, s.type, ROUND(AVG(r.value::float)::numeric, 2) AS avg_value, ROUND(MAX(r.value::float)::numeric, 2) AS max_value, ROUND(MIN(r.value::float)::numeric, 2) AS min_value, COUNT(r.id) AS count FROM iot_sensor_readings r LEFT JOIN iot_sensors s ON s.id = r.sensor_id WHERE r.recorded_at >= NOW() - (${hours} * INTERVAL '1 hour') AND s.type = ${type} GROUP BY DATE_TRUNC('hour', r.recorded_at), s.type ORDER BY hour DESC`)
        : await exec(sql`SELECT DATE_TRUNC('hour', r.recorded_at) AS hour, s.type, ROUND(AVG(r.value::float)::numeric, 2) AS avg_value, ROUND(MAX(r.value::float)::numeric, 2) AS max_value, ROUND(MIN(r.value::float)::numeric, 2) AS min_value, COUNT(r.id) AS count FROM iot_sensor_readings r LEFT JOIN iot_sensors s ON s.id = r.sensor_id WHERE r.recorded_at >= NOW() - (${hours} * INTERVAL '1 hour') GROUP BY DATE_TRUNC('hour', r.recorded_at), s.type ORDER BY hour DESC`);
      return Ok(result);
    } catch (e) { return Err((e as Error).message); }
  }
}
