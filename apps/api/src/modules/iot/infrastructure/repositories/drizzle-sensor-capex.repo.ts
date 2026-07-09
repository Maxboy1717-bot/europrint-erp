/**
 * @module drizzle-sensor-capex.repo
 * @description Repository / data-access layer for the sensor_devices CAPEX registry.
 *   Wraps parametrized SQL (sensor_devices has an integer serial PK — the @shared/db barrel's
 *   uuid def is stale drift, so we query the base table directly like drizzle-iot-*.repo do)
 *   and returns Result<T>. install_status = needed/planned/installed CAPEX axis.
 */

import { Injectable } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Ok, Err } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

const SELECT_COLS = sql`id, device_code, name, name_ru, device_type, connection_type,
  ip_address, port, location, is_active, status, install_status, last_heartbeat, created_at`;

export interface SensorCapexCreate {
  deviceCode: string;
  name: string;
  nameRu?: string;
  deviceType: string;
  connectionType: string;
  installStatus: string;
  location?: string;
  ipAddress?: string;
  port?: number;
}

export interface SensorCapexUpdate {
  name?: string;
  nameRu?: string;
  installStatus?: string;
  location?: string;
  ipAddress?: string;
  port?: number;
  isActive?: boolean;
}

@Injectable()
export class DrizzleSensorCapexRepo {
  async findAll(installStatus: string | undefined, limit: number, offset: number) {
    try {
      const [rows, totalRows] = await Promise.all([
        installStatus
          ? exec(sql`SELECT ${SELECT_COLS} FROM sensor_devices WHERE install_status = ${installStatus} ORDER BY created_at DESC, id DESC LIMIT ${limit} OFFSET ${offset}`)
          : exec(sql`SELECT ${SELECT_COLS} FROM sensor_devices ORDER BY created_at DESC, id DESC LIMIT ${limit} OFFSET ${offset}`),
        installStatus
          ? exec(sql`SELECT COUNT(*)::int AS total FROM sensor_devices WHERE install_status = ${installStatus}`)
          : exec(sql`SELECT COUNT(*)::int AS total FROM sensor_devices`),
      ]);
      const total = Number((totalRows[0]?.total as number) ?? 0);
      return Ok({ items: rows, total });
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }

  async findByCode(deviceCode: string) {
    try {
      const r = await exec(sql`SELECT id FROM sensor_devices WHERE device_code = ${deviceCode} LIMIT 1`);
      return Ok(r[0] ?? null);
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }

  async create(input: SensorCapexCreate) {
    try {
      const r = await exec(sql`
        INSERT INTO sensor_devices
          (device_code, name, name_ru, device_type, connection_type, ip_address, port, location, install_status, is_active, status)
        VALUES
          (${input.deviceCode}, ${input.name}, ${input.nameRu ?? null}, ${input.deviceType},
           ${input.connectionType}, ${input.ipAddress ?? null}, ${input.port ?? null}, ${input.location ?? null},
           ${input.installStatus}, true, 'offline')
        RETURNING ${SELECT_COLS}`);
      const created = r[0];
      if (!created) return Err({ code: 'INTERNAL', message: 'Yaratilmadi' });
      return Ok(created);
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }

  async update(id: number, input: SensorCapexUpdate) {
    try {
      const existing = await exec(sql`SELECT id FROM sensor_devices WHERE id = ${id} LIMIT 1`);
      if (!existing[0]) return Err({ code: 'NOT_FOUND', message: 'Sensor topilmadi' });

      const sets: SQL[] = [];
      if (input.name !== undefined) sets.push(sql`name = ${input.name}`);
      if (input.nameRu !== undefined) sets.push(sql`name_ru = ${input.nameRu}`);
      if (input.installStatus !== undefined) sets.push(sql`install_status = ${input.installStatus}`);
      if (input.location !== undefined) sets.push(sql`location = ${input.location}`);
      if (input.ipAddress !== undefined) sets.push(sql`ip_address = ${input.ipAddress}`);
      if (input.port !== undefined) sets.push(sql`port = ${input.port}`);
      if (input.isActive !== undefined) sets.push(sql`is_active = ${input.isActive}`);
      if (sets.length === 0) return Err({ code: 'VALIDATION', message: "O'zgartirish uchun maydon yo'q" });

      const r = await exec(sql`UPDATE sensor_devices SET ${sql.join(sets, sql`, `)} WHERE id = ${id} RETURNING ${SELECT_COLS}`);
      const updated = r[0];
      if (!updated) return Err({ code: 'INTERNAL', message: 'Yangilanmadi' });
      return Ok(updated);
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }
}
