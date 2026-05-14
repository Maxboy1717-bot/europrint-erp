/**
 * @module drizzle-kanban-engagement.repo
 * @description Engagement kanban repository: Notifications, Templates,
 * Time Tracking, Tags, Observers, Co-Executors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { and, eq, desc, isNull, sql } from 'drizzle-orm';
import { db, runQuery } from '@shared/db';
import {
  kanbanNotifications, kanbanTemplates, kanbanTimeTracks,
  kanbanTags, kanbanCardTags, kanbanObservers, kanbanCoExecutors,
} from '@shared/db';
import { safeCall, Result } from '@common/result';

const COUNT_EXPR = sql<number>`count(*)::int`;

@Injectable()
export class DrizzleKanbanEngagementRepository {

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

  // ─── Time Tracking ────────────────────────────────────────────────────────

  async startTimeTracking(cardId: string, userId: number, description?: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const row = await db.transaction(async (tx) => {
        // Running sessiyani to'xtatish
        await tx.update(kanbanTimeTracks)
          .set({ isRunning: false, endedAt: _time.now(), durationMinutes: sql`EXTRACT(EPOCH FROM (NOW() - started_at)) / 60` })
          .where(and(eq(kanbanTimeTracks.userId, userId), eq(kanbanTimeTracks.isRunning, true)));
        const [inserted] = await tx.insert(kanbanTimeTracks).values({
          cardId,
          userId,
          startedAt: _time.now(),
          isRunning: true,
          description: description ?? null,
        }).returning();
        if (!inserted) throw new Error('Vaqt kuzatuvini boshlashda xato');
        return inserted;
      });
      return row;
    });
  }

  async stopTimeTracking(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.update(kanbanTimeTracks)
        .set({
          isRunning: false,
          endedAt: _time.now(),
          durationMinutes: sql`GREATEST(1, EXTRACT(EPOCH FROM (NOW() - started_at)) / 60)::int`,
        })
        .where(and(
          eq(kanbanTimeTracks.cardId, cardId),
          eq(kanbanTimeTracks.userId, userId),
          eq(kanbanTimeTracks.isRunning, true),
        ))
        .returning();
      return row ?? { cardId, userId, stopped: true };
    });
  }

  async getTimeEntries(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () =>
      db.select().from(kanbanTimeTracks)
        .where(eq(kanbanTimeTracks.cardId, cardId))
        .orderBy(desc(kanbanTimeTracks.startedAt)),
    );
  }

  // ─── Tags ─────────────────────────────────────────────────────────────────

  async getCardTags(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT t.id, t.name, t.color, ct.card_id, ct.created_at
        FROM kanban_tags t
        JOIN kanban_card_tags ct ON ct.tag_id = t.id::text
        WHERE ct.card_id = ${cardId}
        ORDER BY t.name
      `);
      return rows.rows;
    });
  }

  async addTagToCard(cardId: string, tagData: { name: string; color?: string; boardId?: string }): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      // Teg topish yoki yaratish
      let [tag] = await db.select().from(kanbanTags)
        .where(and(eq(kanbanTags.name, tagData.name), tagData.boardId ? eq(kanbanTags.boardId, tagData.boardId) : sql`TRUE`))
        .limit(1);
      if (!tag) {
        [tag] = await db.insert(kanbanTags).values({
          name: tagData.name,
          color: tagData.color ?? '#3b82f6',
          boardId: tagData.boardId ?? null,
        }).returning();
      }
      if (!tag) throw new Error('Teg yaratishda xato');
      // Karta-teg ulanishi
      const rows = await runQuery<Record<string, unknown>>(sql`
        INSERT INTO kanban_card_tags (card_id, tag_id)
        VALUES (${cardId}, ${tag.id})
        ON CONFLICT (card_id, tag_id) DO NOTHING
        RETURNING *
      `);
      return { tag, cardId, added: true, rows: rows.rows };
    });
  }

  async removeTagFromCard(cardId: string, tagId: string): Promise<Result<void>> {
    return safeCall(async () => {
      await runQuery(sql`
        DELETE FROM kanban_card_tags WHERE card_id = ${cardId} AND tag_id = ${tagId}
      `);
    });
  }

  // ─── Observers ────────────────────────────────────────────────────────────

  async getObservers(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT o.id, o.card_id, o.user_id, o.created_at,
               COALESCE(NULLIF(TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), ''), u.email, 'Foydalanuvchi') AS full_name,
               u.email,
               u.profile_image_url
        FROM kanban_observers o
        LEFT JOIN users u ON u.id::text = o.user_id::text
        WHERE o.card_id = ${cardId}
        ORDER BY o.created_at
      `);
      return rows.rows;
    });
  }

  async addObserver(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        INSERT INTO kanban_observers (card_id, user_id)
        VALUES (${cardId}, ${userId})
        ON CONFLICT (card_id, user_id) DO NOTHING
        RETURNING *
      `);
      return rows.rows[0] ?? { cardId, userId, added: true };
    });
  }

  async removeObserver(cardId: string, observerId: string): Promise<Result<void>> {
    return safeCall(async () => {
      await runQuery(sql`
        DELETE FROM kanban_observers WHERE card_id = ${cardId} AND user_id = ${observerId}
      `);
    });
  }

  // ─── Co-Executors ─────────────────────────────────────────────────────────

  async getCoExecutors(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT ce.id, ce.card_id, ce.user_id, ce.created_at,
               COALESCE(NULLIF(TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), ''), u.email, 'Foydalanuvchi') AS full_name,
               u.email,
               u.profile_image_url
        FROM kanban_co_executors ce
        LEFT JOIN users u ON u.id::text = ce.user_id::text
        WHERE ce.card_id = ${cardId}
        ORDER BY ce.created_at
      `);
      return rows.rows;
    });
  }

  async addCoExecutor(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        INSERT INTO kanban_co_executors (card_id, user_id)
        VALUES (${cardId}, ${userId})
        ON CONFLICT (card_id, user_id) DO NOTHING
        RETURNING *
      `);
      return rows.rows[0] ?? { cardId, userId, added: true };
    });
  }

  async removeCoExecutor(cardId: string, coExecutorId: string): Promise<Result<void>> {
    return safeCall(async () => {
      await runQuery(sql`
        DELETE FROM kanban_co_executors WHERE card_id = ${cardId} AND user_id = ${coExecutorId}
      `);
    });
  }
}
