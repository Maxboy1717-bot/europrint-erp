/**
 * @module vendors.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { vendors } from '@europrint/schemas';
import { eq, count, desc } from 'drizzle-orm';

@Injectable()
export class VendorsRepository {
  async findAll(page: number, limit: number): Promise<Result<{ data: (typeof vendors.$inferSelect)[]; total: number }>> {
  try {  
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(vendors),
        db.select().from(vendors).orderBy(desc(vendors.createdAt)).limit(limit).offset((page - 1) * limit),
      ]);
      return Ok({ data, total: Number(countResult[0]?.count || 0) });  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findOne(id: number): Promise<Result<typeof vendors.$inferSelect | null>> {
  try {  
      const rows = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
      return Ok(rows[0] ?? null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async create(row: typeof vendors.$inferInsert): Promise<Result<Record<string, unknown>>>  {
  try {  
      const result = await db.insert(vendors).values(row).returning();
      return Ok(result[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async update(id: number, dto: Partial<typeof vendors.$inferInsert>): Promise<Result<Record<string, unknown>>>  {
  try {  
      const result = await db.update(vendors).set(dto).where(eq(vendors.id, id)).returning();
      return Ok(result[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async deactivate(id: number): Promise<Result<void>>  {
  try {  
      await db.update(vendors).set({ isActive: false }).where(eq(vendors.id, id));  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }
}
