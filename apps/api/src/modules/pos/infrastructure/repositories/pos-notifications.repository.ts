/**
 * @module pos-notifications.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db, eq, desc, and, count } from '@workspace/db';
import { posNotifications } from '@workspace/db';
import type { IPosNotificationsRepository } from '../../domain/repositories/i-pos-notifications.repo';

@Injectable()
export class PosNotificationsRepository implements IPosNotificationsRepository {
  async getForUser(userId: number, limit: number = 50): Promise<Result<(typeof posNotifications.$inferSelect)[]>> {
    try {
      const rows = await db
        .select()
        .from(posNotifications)
        .where(eq(posNotifications.userId, userId))
        .orderBy(desc(posNotifications.createdAt))
        .limit(limit);
      return Ok(rows);
    } catch (e) {
      return Err(String(e));
    }
  }

  async markRead(id: number, userId: number): Promise<Result<typeof posNotifications.$inferSelect>> {
    try {
      const [row] = await db
        .update(posNotifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(eq(posNotifications.id, id), eq(posNotifications.userId, userId)))
        .returning();
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async markAllRead(userId: number): Promise<Result<void>> {
    try {
      await db
        .update(posNotifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(eq(posNotifications.userId, userId), eq(posNotifications.isRead, false)));
      return Ok(undefined);
    } catch (e) {
      return Err(String(e));
    }
  }

  async insert(data: typeof posNotifications.$inferInsert): Promise<Result<typeof posNotifications.$inferSelect>> {
    try {
      const [row] = await db.insert(posNotifications).values(data).returning();
      return Ok(row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async countUnread(userId: number): Promise<Result<number>> {
    try {
      const [row] = await db
        .select({ total: count() })
        .from(posNotifications)
        .where(and(eq(posNotifications.userId, userId), eq(posNotifications.isRead, false)));
      return Ok(row?.total ?? 0);
    } catch (e) {
      return Err(String(e));
    }
  }
}
