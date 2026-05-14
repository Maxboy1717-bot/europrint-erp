/**
 * @module mro-inventory.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { mroInventory } from '@europrint/schemas';
import { eq, count, desc } from 'drizzle-orm';

@Injectable()
export class MroInventoryRepository {
  async findAll(page: number, limit: number): Promise<Result<{ data: (typeof mroInventory.$inferSelect)[]; total: number }>> {
  try {  
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(mroInventory),
        db.select().from(mroInventory).orderBy(desc(mroInventory.createdAt)).limit(limit).offset((page - 1) * limit),
      ]);
      return Ok({ data, total: Number(countResult[0]?.count || 0) });  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findOne(id: number): Promise<Result<typeof mroInventory.$inferSelect | null>> {
  try {  
      const rows = await db.select().from(mroInventory).where(eq(mroInventory.id, id));
      return Ok(rows[0] ?? null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async create(row: typeof mroInventory.$inferInsert): Promise<Result<Record<string, unknown>>>  {
  try {  
      const result = await db.insert(mroInventory).values(row).returning();
      return Ok(result[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async update(id: number, dto: Partial<typeof mroInventory.$inferInsert>): Promise<Result<Record<string, unknown>>>  {
  try {  
      const result = await db.update(mroInventory).set(dto).where(eq(mroInventory.id, id)).returning();
      return Ok(result[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async remove(id: number): Promise<Result<void>>  {
  try {  
      await db.delete(mroInventory).where(eq(mroInventory.id, id));  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }
}
