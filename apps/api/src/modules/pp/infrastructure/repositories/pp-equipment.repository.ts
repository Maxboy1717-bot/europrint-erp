/**
 * @module pp-equipment.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (PP)
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import type { IPpEquipmentRepo } from '../../domain/repositories/i-pp-equipment.repo';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class PpEquipmentRepository implements IPpEquipmentRepo {
  async listEquipment(status: string | null, limit: number): Promise<Result<Row[]>>  {
  try {
      return status
        ? exec(sql`SELECT e.*, wc.name AS work_center_name FROM equipment e LEFT JOIN work_centers wc ON wc.id = e.work_center_id WHERE e.status = ${status} ORDER BY e.name LIMIT ${limit}`)
        : exec(sql`SELECT e.*, wc.name AS work_center_name FROM equipment e LEFT JOIN work_centers wc ON wc.id = e.work_center_id ORDER BY e.name LIMIT ${limit}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listWorkCenters(limit: number): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT wc.id, wc.code AS equipment_code, wc.name, wc.hours_per_day AS capacity_per_hour, 'active' AS status FROM work_centers wc WHERE wc.deleted_at IS NULL ORDER BY wc.name LIMIT ${limit}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findById(id: number): Promise<Result<Row | null>>  {
  try {
      const r = await exec(sql`SELECT e.*, wc.name AS work_center_name FROM equipment e LEFT JOIN work_centers wc ON wc.id = e.work_center_id WHERE e.id = ${id}`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async create(body: Row): Promise<Result<Row | null>>  {
  try {
      const r = await exec(sql`INSERT INTO equipment (name, code, work_center_id, status, description) VALUES (${body['name'] ?? null}, ${body['code'] ?? null}, ${body['workCenterId'] ?? null}, ${body['status'] ?? 'active'}, ${body['description'] ?? null}) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async update(id: number, body: Row): Promise<Result<Row | null>>  {
  try {
      const r = await exec(sql`UPDATE equipment SET status = COALESCE(${body['status'] ?? null}, status), name = COALESCE(${body['name'] ?? null}, name), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
