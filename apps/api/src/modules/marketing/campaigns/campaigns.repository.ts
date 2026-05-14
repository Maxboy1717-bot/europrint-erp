/**
 * @module campaigns.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { marketingCampaigns } from '@europrint/schemas';
import { eq, and, isNull, desc } from 'drizzle-orm';

@Injectable()
export class CampaignsRepository {
  async findAll(): Promise<Result<Record<string, unknown>[]>> {
  try {  
      return Ok(await db.select().from(marketingCampaigns).where(isNull(marketingCampaigns.deletedAt)).orderBy(desc(marketingCampaigns.createdAt)));  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findOne(id: number): Promise<Result<Record<string, unknown> | null>> {
  try {  
      const rows = await db.select().from(marketingCampaigns).where(and(eq(marketingCampaigns.id, id), isNull(marketingCampaigns.deletedAt)));
      return Ok(rows[0] ?? null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async create(values: typeof marketingCampaigns.$inferInsert): Promise<Result<Record<string, unknown>>> {
  try {  
      const result = await db.insert(marketingCampaigns).values(values).returning();
      return Ok(result[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async update(id: number, values: Partial<typeof marketingCampaigns.$inferInsert>): Promise<Result<Record<string, unknown>>> {
  try {  
      const result = await db.update(marketingCampaigns).set(values).where(eq(marketingCampaigns.id, id)).returning();
      return Ok(result[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async softDelete(id: number): Promise<Result<void>> {
  try {  
      await db.update(marketingCampaigns).set({ deletedAt: _time.now() }).where(eq(marketingCampaigns.id, id));  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }
}
