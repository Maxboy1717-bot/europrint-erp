/**
 * @module leads.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { marketingLeads } from '@europrint/schemas';
import { eq, and, isNull, desc, count } from 'drizzle-orm';

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

  async getLossAnalysis(): Promise<Result<{ total: number; breakdown: Array<{ reason: string; count: number; percent: number }> }>> {
    try {
      const rows = await db
        .select({ reason: marketingLeads.lostReason, cnt: count() })
        .from(marketingLeads)
        .where(and(eq(marketingLeads.status, 'lost'), isNull(marketingLeads.deletedAt)))
        .groupBy(marketingLeads.lostReason);
      const total = rows.reduce((s, r) => s + Number(r.cnt), 0);
      const breakdown = rows.map(r => ({
        reason: r.reason ?? 'other',
        count: Number(r.cnt),
        percent: total > 0 ? Math.round((Number(r.cnt) / total) * 100) : 0,
      }));
      return Ok({ total, breakdown });
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
