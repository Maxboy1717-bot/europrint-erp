/**
 * @module routes.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { logisticsRoutes } from '@europrint/schemas';
import { eq, count, desc } from 'drizzle-orm';

@Injectable()
export class RoutesRepository {
  async findAll(page: number, limit: number): Promise<Result<{ data: (typeof logisticsRoutes.$inferSelect)[]; total: number }>> {
  try {  
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(logisticsRoutes),
        db.select().from(logisticsRoutes).orderBy(desc(logisticsRoutes.createdAt)).limit(limit).offset((page - 1) * limit),
      ]);
      return Ok({ data, total: Number(countResult[0]?.count || 0) });  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findOne(id: number): Promise<Result<typeof logisticsRoutes.$inferSelect | null>> {
  try {  
      const rows = await db.select().from(logisticsRoutes).where(eq(logisticsRoutes.id, id));
      return Ok(rows[0] ?? null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async create(row: typeof logisticsRoutes.$inferInsert): Promise<Result<Record<string, unknown>>>  {
  try {  
      const result = await db.insert(logisticsRoutes).values(row).returning();
      return Ok(result[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async update(id: number, dto: Partial<typeof logisticsRoutes.$inferInsert>): Promise<Result<Record<string, unknown>>>  {
  try {  
      const result = await db.update(logisticsRoutes).set(dto).where(eq(logisticsRoutes.id, id)).returning();
      return Ok(result[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async remove(id: number): Promise<Result<void>>  {
  try {  
      await db.delete(logisticsRoutes).where(eq(logisticsRoutes.id, id));  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }
}
