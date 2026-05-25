/**
 * @module sensors.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { SENSOR_MAX_FETCH } from '@common/constants/app.constants';
import { db } from '@shared/db';
import { iotSensors } from '@europrint/schemas';
import { eq, isNull } from 'drizzle-orm';

@Injectable()
export class SensorsRepository {
  async findAll(): Promise<Result<Record<string, unknown>[]>> {
  try {  
      return Ok(await db.select().from(iotSensors).where(isNull(iotSensors.createdAt)).limit(SENSOR_MAX_FETCH).offset(0));  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findLive(): Promise<Result<Record<string, unknown>[]>> {
  try {  
      return Ok(await db.select().from(iotSensors).where(eq(iotSensors.isActive, true)).limit(SENSOR_MAX_FETCH).offset(0));  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findOne(id: number): Promise<Result<Record<string, unknown> | null>> {
  try {  
      const rows = await db.select().from(iotSensors).where(eq(iotSensors.id, id)).limit(1).offset(0);
      return Ok(rows[0] ?? null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async create(values: typeof iotSensors.$inferInsert): Promise<Result<Record<string, unknown>>> {
  try {  
      const result = await db.insert(iotSensors).values(values).returning();
      return Ok(result[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async update(id: number, values: Partial<typeof iotSensors.$inferInsert>): Promise<Result<Record<string, unknown>>> {
  try {  
      const result = await db.update(iotSensors).set(values).where(eq(iotSensors.id, id)).returning();
      return Ok(result[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
