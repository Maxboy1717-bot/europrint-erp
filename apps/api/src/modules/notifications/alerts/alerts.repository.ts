import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { notifications } from '@europrint/schemas';
import { eq, count, desc } from 'drizzle-orm';

type NotificationRow = typeof notifications.$inferSelect;

@Injectable()
export class AlertsRepository {
  async findAll(page: number, limit: number): Promise<Result<{ data: NotificationRow[]; total: number }>> {
  try {  
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(notifications),
        db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(limit).offset((page - 1) * limit),
      ]);
      return Ok({ data, total: Number(countResult[0]?.count || 0) });  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findOne(id: number): Promise<Result<NotificationRow | null>>  {
  try {  
      const rows = await db.select().from(notifications).where(eq(notifications.id, id));
      return Ok(rows[0] ?? null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async create(values: typeof notifications.$inferInsert): Promise<Result<Record<string, unknown>>>  {
  try {  
      const result = await db.insert(notifications).values(values).returning();
      return Ok((Array.isArray(result) ? result : [])[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async update(id: number, dto: Partial<typeof notifications.$inferInsert>): Promise<Result<Record<string, unknown>>>  {
  try {  
      const result = await db.update(notifications).set(dto).where(eq(notifications.id, id)).returning();
      return Ok((Array.isArray(result) ? result : [])[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async remove(id: number): Promise<Result<void>>  {
  try {  
      await db.delete(notifications).where(eq(notifications.id, id));  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }
}
