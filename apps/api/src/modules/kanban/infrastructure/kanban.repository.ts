/**
 * @module kanban.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { kanbanRobots, kanbanNotifications } from '@shared/db';
import { eq, and } from 'drizzle-orm';
import { safeCall, Result, Ok } from '@common/result';

type KanbanRobot      = typeof kanbanRobots.$inferSelect;
type NotificationInsert = typeof kanbanNotifications.$inferInsert;

@Injectable()
export class KanbanRepository {
  async findActiveRobots(boardId: string, trigger: string): Promise<Result<KanbanRobot[]>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(kanbanRobots)
        .where(and(
          eq(kanbanRobots.boardId, boardId),
          eq(kanbanRobots.trigger, trigger),
          eq(kanbanRobots.isActive, true),
        ));
      return Array.isArray(rows) ? rows : [];
    });
  }

  async insertNotification(data: Omit<NotificationInsert, 'id' | 'createdAt' | 'isRead'>): Promise<Result<void>> {
    return safeCall(async () => {
      await db.insert(kanbanNotifications).values(data as NotificationInsert);
    });
  }
}
