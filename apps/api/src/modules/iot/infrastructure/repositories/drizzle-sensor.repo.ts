/**
 * @module drizzle-sensor.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { safeNum } from '@common/math';
import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { Result, Ok, Err, isErr } from '@common/result';
import { ISensorRepo } from '../../domain/repositories/i-sensor.repo';
import { SensorDevice } from '../../domain/aggregates/sensor-device.aggregate';
import { SensorReading } from '../../domain/aggregates/sensor-reading.aggregate';
import { SensorStatus, SensorType } from '../../domain/enums/sensor-status.enum';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class DrizzleSensorRepo implements ISensorRepo {
  private readonly logger = new Logger(DrizzleSensorRepo.name);

  async findDeviceById(id: string): Promise<Result<SensorDevice>> {
    try {
      const r = await exec(sql`SELECT id, sensor_code, name, type, location, unit, is_active, created_at, min_threshold, max_threshold, CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status FROM iot_sensors WHERE id = ${id} LIMIT 1`);
      if (!r.length) return Err('Device not found');
      return Ok(this.mapToDevice(r[0]));
    } catch { this.logger.error('Find device error'); return Err('Failed to find device'); }
  }

  async findAllDevices(filters: { status?: string; type?: string; page?: number; limit?: number }): Promise<Result<{ items: SensorDevice[]; total: number }>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;
      const [items, countRows] = await Promise.all([
        filters.status === 'active' && filters.type
          ? exec(sql`SELECT id, sensor_code, name, type, location, unit, is_active, created_at, CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status FROM iot_sensors WHERE is_active = true AND type = ${filters.type} ORDER BY name LIMIT ${limit} OFFSET ${offset}`)
          : filters.status === 'inactive' && filters.type
          ? exec(sql`SELECT id, sensor_code, name, type, location, unit, is_active, created_at, CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status FROM iot_sensors WHERE is_active = false AND type = ${filters.type} ORDER BY name LIMIT ${limit} OFFSET ${offset}`)
          : filters.status === 'active'
          ? exec(sql`SELECT id, sensor_code, name, type, location, unit, is_active, created_at, CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status FROM iot_sensors WHERE is_active = true ORDER BY name LIMIT ${limit} OFFSET ${offset}`)
          : filters.status === 'inactive'
          ? exec(sql`SELECT id, sensor_code, name, type, location, unit, is_active, created_at, CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status FROM iot_sensors WHERE is_active = false ORDER BY name LIMIT ${limit} OFFSET ${offset}`)
          : filters.type
          ? exec(sql`SELECT id, sensor_code, name, type, location, unit, is_active, created_at, CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status FROM iot_sensors WHERE type = ${filters.type} ORDER BY name LIMIT ${limit} OFFSET ${offset}`)
          : exec(sql`SELECT id, sensor_code, name, type, location, unit, is_active, created_at, CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status FROM iot_sensors ORDER BY name LIMIT ${limit} OFFSET ${offset}`),
        exec(sql`SELECT COUNT(*) AS total FROM iot_sensors`),
      ]);
      return Ok({ items: (Array.isArray(items) ? items : []).map((item) => this.mapToDevice(item)), total: Number(countRows[0]?.total ?? 0) });
    } catch { this.logger.error('Find all devices error'); return Err('Failed to find devices'); }
  }

  async saveDevice(device: SensorDevice): Promise<Result<SensorDevice>> {
    try {
      const sensorCode = `SNS-${Date.now()}`;
      const r = await exec(sql`INSERT INTO iot_sensors (sensor_code, name, type, location, unit, is_active) VALUES (${sensorCode}, ${device.name}, ${device.type ?? 'generic'}, '', '', true) RETURNING id, sensor_code, name, type, location, unit, is_active, created_at, CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status`);
      if (!r.length) return Err('Failed to save device');
      return Ok(this.mapToDevice(r[0]));
    } catch { this.logger.error('Save device error'); return Err('Failed to save device'); }
  }

  async updateDevice(id: string, data: Partial<SensorDevice>): Promise<Result<SensorDevice>> {
    try {
      const sets: ReturnType<typeof sql>[] = [];
      if (data.name) sets.push(sql`name = ${data.name}`);
      if (data.type) sets.push(sql`type = ${data.type}`);
      if (data.location !== undefined) sets.push(sql`location = ${data.location}`);
      if (data.status !== undefined) sets.push(sql`is_active = ${data.status === 'active'}`);
      if (!sets.length) return this.findDeviceById(id);
      const setClauses = sql.join(sets, sql`, `);
      const r = await exec(sql`UPDATE iot_sensors SET ${setClauses} WHERE id = ${id} RETURNING id, sensor_code, name, type, location, unit, is_active, created_at, CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status`);
      if (!r.length) return Err('Device not found');
      return Ok(this.mapToDevice(r[0]));
    } catch { this.logger.error('Update device error'); return Err('Failed to update device'); }
  }

  async saveReading(reading: SensorReading): Promise<Result<SensorReading>> {
    try {
      const deviceResult = await this.findDeviceById(reading.deviceId);
      if (isErr(deviceResult)) return Err('Device not found');
      const device = deviceResult.data;
      const thresholds = device.thresholds ?? {};
      let status = 'normal';
      if (thresholds.min !== undefined && reading.value < thresholds.min) status = 'anomaly';
      if (thresholds.max !== undefined && reading.value > thresholds.max) status = 'anomaly';
      const r = await exec(sql`INSERT INTO iot_sensor_readings (sensor_id, value, status, recorded_at) VALUES (${reading.deviceId}, ${reading.value}, ${status}, ${reading.timestamp ?? _time.now()}) RETURNING id, sensor_id AS device_id, value, status, recorded_at`);
      if (!r.length) return Err('Failed to save reading');
      return this.mapToReadingWithUnit(r[0], reading.unit);
    } catch { this.logger.error('Save reading error'); return Err('Failed to save reading'); }
  }

  async findReadings(deviceId: string, opts: { from?: Date; to?: Date; limit?: number }): Promise<Result<SensorReading[]>> {
    try {
      const limit = opts.limit || 100;
      const r = opts.from && opts.to
        ? await exec(sql`SELECT r.id, r.sensor_id AS device_id, r.value, r.status, r.recorded_at, s.unit FROM iot_sensor_readings r LEFT JOIN iot_sensors s ON s.id = r.sensor_id WHERE r.sensor_id = ${deviceId} AND r.recorded_at >= ${opts.from} AND r.recorded_at <= ${opts.to} ORDER BY r.recorded_at DESC LIMIT ${limit}`)
        : opts.from
        ? await exec(sql`SELECT r.id, r.sensor_id AS device_id, r.value, r.status, r.recorded_at, s.unit FROM iot_sensor_readings r LEFT JOIN iot_sensors s ON s.id = r.sensor_id WHERE r.sensor_id = ${deviceId} AND r.recorded_at >= ${opts.from} ORDER BY r.recorded_at DESC LIMIT ${limit}`)
        : opts.to
        ? await exec(sql`SELECT r.id, r.sensor_id AS device_id, r.value, r.status, r.recorded_at, s.unit FROM iot_sensor_readings r LEFT JOIN iot_sensors s ON s.id = r.sensor_id WHERE r.sensor_id = ${deviceId} AND r.recorded_at <= ${opts.to} ORDER BY r.recorded_at DESC LIMIT ${limit}`)
        : await exec(sql`SELECT r.id, r.sensor_id AS device_id, r.value, r.status, r.recorded_at, s.unit FROM iot_sensor_readings r LEFT JOIN iot_sensors s ON s.id = r.sensor_id WHERE r.sensor_id = ${deviceId} ORDER BY r.recorded_at DESC LIMIT ${limit}`);
      return Ok((Array.isArray(r) ? r : []).map((item) => this.mapToReading(item)));
    } catch { this.logger.error('Find readings error'); return Err('Failed to find readings'); }
  }

  async findAnomalies(opts: { page?: number; limit?: number }): Promise<Result<{ items: SensorReading[]; total: number }>> {
    try {
      const page = opts.page || 1;
      const limit = opts.limit || 20;
      const offset = (page - 1) * limit;
      const [items, countRows] = await Promise.all([
        exec(sql`SELECT r.id, r.sensor_id AS device_id, r.value, r.status, r.recorded_at, s.unit, s.max_threshold FROM iot_sensor_readings r LEFT JOIN iot_sensors s ON s.id = r.sensor_id WHERE r.status = 'anomaly' OR (s.max_threshold IS NOT NULL AND r.value::float > s.max_threshold::float) ORDER BY r.recorded_at DESC LIMIT ${limit} OFFSET ${offset}`),
        exec(sql`SELECT COUNT(*) AS total FROM iot_sensor_readings r LEFT JOIN iot_sensors s ON s.id = r.sensor_id WHERE r.status = 'anomaly' OR (s.max_threshold IS NOT NULL AND r.value::float > s.max_threshold::float)`),
      ]);
      return Ok({ items: (Array.isArray(items) ? items : []).map((item) => this.mapToReading(item)), total: Number(countRows[0]?.total ?? 0) });
    } catch { this.logger.error('Find anomalies error'); return Err('Failed to find anomalies'); }
  }

  private mapToDevice(row: Row): SensorDevice {
    const device = new SensorDevice(String(row.name), String(row.name), row.type as SensorType);
    device.id = String(row.id ?? '');
    device.status = row.status as SensorStatus;
    device.createdAt = row.created_at ? new Date(String(row.created_at)) : _time.now();
    device.updatedAt = row.created_at ? new Date(String(row.created_at)) : _time.now();
    device.lastReading = null;
    const minT = row.min_threshold != null ? Number(row.min_threshold) : undefined;
    const maxT = row.max_threshold != null ? Number(row.max_threshold) : undefined;
    if (minT !== undefined || maxT !== undefined) {
      device.thresholds = { min: minT, max: maxT, unit: String(row.unit ?? '') };
    }
    return device;
  }

  private mapToReading(row: Row): SensorReading { return this.buildReading(row, String(row.unit ?? '')); }
  private mapToReadingWithUnit(row: Row, unit: string): Result<SensorReading> { return Ok(this.buildReading(row, unit)); }
  private buildReading(row: Row, unit: string): SensorReading {
    const reading = new SensorReading(String(row.device_id ?? row.sensor_id ?? ''), safeNum(row.value), unit);
    reading.id = String(row.id ?? '');
    reading.timestamp = row.recorded_at ? new Date(String(row.recorded_at)) : _time.now();
    if (row.status === 'anomaly') reading.markAsAnomaly();
    return reading;
  }
}
