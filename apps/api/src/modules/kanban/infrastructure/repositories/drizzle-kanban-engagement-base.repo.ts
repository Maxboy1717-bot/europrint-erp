/**
 * @module drizzle-kanban-engagement-base.repo
 * @description Engagement repository base: Notifications + Templates.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { and, eq, desc, isNull, sql } from 'drizzle-orm';
import { db } from '@shared/db';
import { kanbanNotifications, kanbanTemplates } from '@shared/db';
import { safeCall, Result } from '@common/result';

export const COUNT_EXPR = sql<number>`count(*)::int`;

@Injectable()
export class DrizzleKanbanEngagementBaseRepository {

  // ─── Notifications ────────────────────────────────────────────────────────

  async getUnreadCount(userId: number): Promise<Result<number>> {
    return safeCall(async () => {
      const [row] = await db.select({ count: COUNT_EXPR })
        .from(kanbanNotifications)
        .where(and(eq(kanbanNotifications.userId, userId), eq(kanbanNotifications.isRead, false)));
      return Number(row?.count ?? 0);
    });
  }

  async getNotifications(userId: number, limit = 50, offset = 0): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () =>
      db.select().from(kanbanNotifications)
        .where(eq(kanbanNotifications.userId, userId))
        .orderBy(desc(kanbanNotifications.createdAt))
        .limit(limit)
        .offset(offset),
    );
  }

  async markNotificationRead(id: string, userId: number): Promise<Result<void>> {
    return safeCall(async () => {
      await db.update(kanbanNotifications)
        .set({ isRead: true })
        .where(and(eq(kanbanNotifications.id, id), eq(kanbanNotifications.userId, userId)));
    });
  }

  async markAllNotificationsRead(userId: number): Promise<Result<void>> {
    return safeCall(async () => {
      await db.update(kanbanNotifications)
        .set({ isRead: true })
        .where(and(eq(kanbanNotifications.userId, userId), eq(kanbanNotifications.isRead, false)));
    });
  }

  async createNotification(data: {
    userId: number; cardId?: string; boardId?: string;
    type: string; title: string; message?: string;
  }): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.insert(kanbanNotifications).values({
        userId: data.userId,
        cardId: data.cardId ?? null,
        boardId: data.boardId ?? null,
        type: data.type,
        title: data.title,
        message: data.message ?? null,
      }).returning();
      if (!row) throw new Error('Bildirishnoma yaratishda xato');
      return row;
    });
  }

  // ─── Templates ────────────────────────────────────────────────────────────

  async getTemplates(boardId?: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const conditions = [isNull(kanbanTemplates.deletedAt)];
      if (boardId) conditions.push(eq(kanbanTemplates.boardId, boardId));
      return db.select().from(kanbanTemplates)
        .where(and(...conditions))
        .orderBy(desc(kanbanTemplates.createdAt));
    });
  }

  async createTemplate(data: {
    name: string; description?: string; priority?: string;
    boardId?: string; checklistItems?: unknown[]; columnsConfig?: unknown[];
    createdById?: number;
  }): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.insert(kanbanTemplates).values({
        name: data.name,
        description: data.description ?? null,
        priority: data.priority ?? 'normal',
        boardId: data.boardId ?? null,
        checklistItems: data.checklistItems ?? [],
        columnsConfig: data.columnsConfig ?? [],
        createdById: data.createdById ?? null,
      }).returning();
      if (!row) throw new Error('Shablon yaratishda xato');
      return row;
    });
  }

  async updateTemplate(id: string, data: {
    name?: string; description?: string; priority?: string;
    checklistItems?: unknown[]; columnsConfig?: unknown[];
  }): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const updates: Record<string, unknown> = { updatedAt: _time.now() };
      if (data.name !== undefined) updates.name = data.name;
      if (data.description !== undefined) updates.description = data.description;
      if (data.priority !== undefined) updates.priority = data.priority;
      if (data.checklistItems !== undefined) updates.checklistItems = data.checklistItems;
      if (data.columnsConfig !== undefined) updates.columnsConfig = data.columnsConfig;
      const [row] = await db.update(kanbanTemplates)
        .set(updates)
        .where(and(eq(kanbanTemplates.id, id), isNull(kanbanTemplates.deletedAt)))
        .returning();
      return row ?? { id };
    });
  }

  async deleteTemplate(id: string): Promise<Result<void>> {
    return safeCall(async () => {
      await db.update(kanbanTemplates)
        .set({ deletedAt: _time.now() })
        .where(eq(kanbanTemplates.id, id));
    });
  }
}
