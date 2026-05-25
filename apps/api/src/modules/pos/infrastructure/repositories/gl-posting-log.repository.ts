/**
 * @module gl-posting-log.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db, eq, desc, and } from '@workspace/db';
import { glPostingLog } from '@workspace/db';

@Injectable()
export class GlPostingLogRepository {
  async insertLog(data: typeof glPostingLog.$inferInsert): Promise<Result<typeof glPostingLog.$inferSelect>> {
    try {
      const [row] = await db.insert(glPostingLog).values(data).returning();
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async getByMovement(movementId: number): Promise<Result<(typeof glPostingLog.$inferSelect)[]>> {
    try {
      const rows = await db
        .select()
        .from(glPostingLog)
        .where(eq(glPostingLog.movementId, movementId))
        .orderBy(desc(glPostingLog.processedAt));
      return Ok(rows);
    } catch (e) {
      return Err(String(e));
    }
  }

  async getPendingEntries(): Promise<Result<(typeof glPostingLog.$inferSelect)[]>> {
    try {
      const rows = await db
        .select()
        .from(glPostingLog)
        .where(eq(glPostingLog.status, 'AWAITING_REVIEW'))
        .orderBy(desc(glPostingLog.processedAt));
      return Ok(rows);
    } catch (e) {
      return Err(String(e));
    }
  }

  async approveEntry(id: number, approvedBy: number): Promise<Result<typeof glPostingLog.$inferSelect>> {
    try {
      const [row] = await db
        .update(glPostingLog)
        .set({ status: 'POSTED', approvedBy, approvedAt: new Date() })
        .where(eq(glPostingLog.id, id))
        .returning();
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async rejectEntry(id: number, approvedBy: number): Promise<Result<typeof glPostingLog.$inferSelect>> {
    try {
      const [row] = await db
        .update(glPostingLog)
        .set({ status: 'REJECTED', approvedBy, approvedAt: new Date() })
        .where(eq(glPostingLog.id, id))
        .returning();
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async approveByMovement(movementId: number, approvedBy: number): Promise<Result<(typeof glPostingLog.$inferSelect)[]>> {
    try {
      const rows = await db
        .update(glPostingLog)
        .set({ status: 'POSTED', approvedBy, approvedAt: new Date() })
        .where(and(eq(glPostingLog.movementId, movementId), eq(glPostingLog.status, 'AWAITING_REVIEW')))
        .returning();
      return Ok(rows);
    } catch (e) {
      return Err(String(e));
    }
  }

  async getJournal(limit: number = 100): Promise<Result<(typeof glPostingLog.$inferSelect)[]>> {
    try {
      const rows = await db
        .select()
        .from(glPostingLog)
        .where(and(eq(glPostingLog.status, 'POSTED')))
        .orderBy(desc(glPostingLog.processedAt))
        .limit(limit);
      return Ok(rows);
    } catch (e) {
      return Err(String(e));
    }
  }
}
