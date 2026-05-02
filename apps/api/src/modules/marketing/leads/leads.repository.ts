import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { marketingLeads } from '@europrint/schemas';
import { eq, and, isNull, desc } from 'drizzle-orm';

@Injectable()
export class LeadsRepository {
  async findAll(): Promise<Result<Record<string, unknown>[]>> {
  try {  
      return Ok(await db.select().from(marketingLeads).where(isNull(marketingLeads.deletedAt)).orderBy(desc(marketingLeads.createdAt)));  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findOne(id: number): Promise<Result<Record<string, unknown> | null>> {
  try {  
      const rows = await db.select().from(marketingLeads).where(and(eq(marketingLeads.id, id), isNull(marketingLeads.deletedAt)));
      return Ok(rows[0] ?? null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async create(values: typeof marketingLeads.$inferInsert): Promise<Result<Record<string, unknown>>> {
  try {  
      const result = await db.insert(marketingLeads).values(values).returning();
      return Ok(result[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async update(id: number, values: Partial<typeof marketingLeads.$inferInsert>): Promise<Result<Record<string, unknown>>> {
  try {  
      const result = await db.update(marketingLeads).set(values).where(eq(marketingLeads.id, id)).returning();
      return Ok(result[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async softDelete(id: number): Promise<Result<void>> {
  try {  
      await db.update(marketingLeads).set({ deletedAt: _time.now() }).where(eq(marketingLeads.id, id));  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }
}
