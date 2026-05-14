/**
 * @module kanban.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { kanbanRobots, kanbanNotifications } from '@shared/db';
import { eq, and } from 'drizzle-orm';

type KanbanRobot      = typeof kanbanRobots.$inferSelect;
type NotificationInsert = typeof kanbanNotifications.$inferInsert;

@Injectable()
export class KanbanRepository {
  async findActiveRobots(boardId: string, trigger: string): Promise<KanbanRobot[]> {
    try {
      const rows = await db.select()
        .from(kanbanRobots)
        .where(and(
          eq(kanbanRobots.boardId, boardId),
          eq(kanbanRobots.trigger, trigger),
          eq(kanbanRobots.isActive, true),
        ));
      return Array.isArray(rows) ? rows : [];
    } catch (e) {
      throw new Error(`kanban.findActiveRobots: ${String(e)}`);
    }
  }

  async insertNotification(data: Omit<NotificationInsert, 'id' | 'createdAt' | 'isRead'>): Promise<void> {
    try {
      await db.insert(kanbanNotifications).values(data as NotificationInsert);
    } catch (e) {
      throw new Error(`kanban.insertNotification: ${String(e)}`);
    }
  }
}
