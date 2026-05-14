/**
 * @module operations.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { downtimeEvents, downtimeReasonCodes, productionSessions } from '@europrint/schemas';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class OperationsRepository {
  async findDowntimeEvents(sessionId?: string): Promise<Result<Record<string, unknown>[]>> {
  try {  
      return Ok(await db.select().from(downtimeEvents)
        .where(eq(downtimeEvents.sessionId, sessionId || downtimeEvents.sessionId))
        .orderBy(desc(downtimeEvents.startedAt))
        .limit(100));  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findSession(sessionId: number): Promise<Result<Record<string, unknown>[]>> {
  try {  
      return Ok(await db.select().from(productionSessions).where(eq(productionSessions.id, sessionId)));  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createDowntimeEvent(dto: typeof downtimeEvents.$inferInsert): Promise<Result<Record<string, unknown> | null>> {
  try {  
      const result = await db.insert(downtimeEvents).values(dto).returning();
      return Ok((Array.isArray(result) ? result : [])[0] ?? null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findReasonCodes(): Promise<Result<Record<string, unknown>[]>> {
  try {  
      return Ok(await db.select().from(downtimeReasonCodes));  } catch (_e) {
    return Err(String(_e));
  }

  }
}
