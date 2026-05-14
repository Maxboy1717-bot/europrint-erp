/**
 * @module drizzle-kanban-core.repo
 * @description Core kanban repository: Flows, Robots, Board-level ops,
 * Checklists, Comments, Watchers, Card creation, Accept/Complete.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { and, eq, desc, sql } from 'drizzle-orm';
import { db, runQuery } from '@shared/db';
import {
  kanbanFlows, kanbanRobots, kanbanChecklists, kanbanChecklistItems,
  kanbanCardComments, kanbanCardWatchers, kanbanNotifications,
} from '@shared/db';
import { safeCall, Result } from '@common/result';
import { castTo } from '@common/db-rows';

@Injectable()
export class DrizzleKanbanCoreRepository {

  // ─── Flows ────────────────────────────────────────────────────────────────

  async getFlowsByBoard(boardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () =>
      db.select().from(kanbanFlows)
        .where(and(eq(kanbanFlows.boardId, boardId), eq(kanbanFlows.status, 'active')))
        .orderBy(desc(kanbanFlows.createdAt)),
    );
  }

  async createFlow(data: {
    boardId: string; name: string; description?: string;
    assignmentType?: string; userIds?: string[];
  }): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.insert(kanbanFlows).values({
        boardId: data.boardId,
        name: data.name,
        description: data.description ?? null,
        config: { assignmentType: data.assignmentType ?? 'round_robin', userIds: data.userIds ?? [], lastIndex: 0 },
      }).returning();
      if (!row) throw new Error('Flow yaratishda xato');
      return row;
    });
  }

  async getFlowById(id: string): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const [row] = await db.select().from(kanbanFlows).where(eq(kanbanFlows.id, id)).limit(1);
      return row ?? null;
    });
  }

  async updateFlow(id: string, name: string, description: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.update(kanbanFlows)
        .set({ name, description, updatedAt: _time.now() })
        .where(eq(kanbanFlows.id, id))
        .returning();
      return row ?? { id };
    });
  }

  async deleteFlow(id: string): Promise<Result<void>> {
    return safeCall(async () => { await db.delete(kanbanFlows).where(eq(kanbanFlows.id, id)); });
  }

  // ─── Robots ───────────────────────────────────────────────────────────────

  async getRobotsByBoard(boardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () =>
      db.select().from(kanbanRobots)
        .where(eq(kanbanRobots.boardId, boardId))
        .orderBy(desc(kanbanRobots.createdAt)),
    );
  }

  async createRobot(data: {
    boardId: string; name: string; trigger: string; actions: unknown[];
  }): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.insert(kanbanRobots).values({
        boardId: data.boardId,
        name: data.name,
        trigger: data.trigger ?? 'card_moved',
        actions: data.actions ?? [],
        isActive: true,
      }).returning();
      if (!row) throw new Error('Robot yaratishda xato');
      return row;
    });
  }

  async getRobotById(id: string): Promise<Result<Record<string, unknown> | null>> {
    return safeCall(async () => {
      const [row] = await db.select().from(kanbanRobots).where(eq(kanbanRobots.id, id)).limit(1);
      return row ?? null;
    });
  }

  async updateRobot(id: string, name: string, isActive: boolean): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.update(kanbanRobots)
        .set({ name, isActive })
        .where(eq(kanbanRobots.id, id))
        .returning();
      return row ?? { id };
    });
  }

  async deleteRobot(id: string): Promise<Result<void>> {
    return safeCall(async () => { await db.delete(kanbanRobots).where(eq(kanbanRobots.id, id)); });
  }

  // ─── Board board-level ────────────────────────────────────────────────────

  async updateBoardFlows(boardId: string, name: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      await runQuery(sql`
        UPDATE kanban_boards SET name = ${name}, updated_at = NOW()
        WHERE id = ${boardId} AND deleted_at IS NULL
      `);
      return { boardId, name, updatedAt: _time.now().toISOString() };
    });
  }

  async deleteBoardFlows(boardId: string): Promise<Result<void>> {
    return safeCall(async () => {
      await runQuery(sql`
        UPDATE kanban_boards SET deleted_at = NOW() WHERE id = ${boardId}
      `);
    });
  }

  // ─── Checklists ───────────────────────────────────────────────────────────

  async getCardChecklists(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => db.select().from(kanbanChecklists)
      .where(eq(kanbanChecklists.cardId, cardId))
      .orderBy(kanbanChecklists.position));
  }

  async createChecklist(cardId: string, title: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.insert(kanbanChecklists).values({ cardId, title }).returning();
      if (!row) throw new Error('Cheklistni yaratishda xato');
      return row;
    });
  }

  async updateChecklist(id: string, title: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.update(kanbanChecklists)
        .set({ title })
        .where(eq(kanbanChecklists.id, id))
        .returning();
      return row ?? { id };
    });
  }

  async deleteChecklist(id: string): Promise<Result<void>> {
    return safeCall(async () => { await db.delete(kanbanChecklists).where(eq(kanbanChecklists.id, id)); });
  }

  async getChecklistItems(checklistId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => db.select().from(kanbanChecklistItems)
      .where(eq(kanbanChecklistItems.checklistId, checklistId))
      .orderBy(kanbanChecklistItems.position));
  }

  async createChecklistItem(checklistId: string, title: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.insert(kanbanChecklistItems).values({ checklistId, title }).returning();
      if (!row) throw new Error('Checklist elementi yaratishda xato');
      return row;
    });
  }

  async updateChecklistItem(
    checklistId: string, itemId: string, title: string, isCompleted: boolean,
  ): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.update(kanbanChecklistItems)
        .set({ title, isCompleted })
        .where(and(eq(kanbanChecklistItems.checklistId, checklistId), eq(kanbanChecklistItems.id, itemId)))
        .returning();
      return row ?? { id: itemId };
    });
  }

  async deleteChecklistItem(checklistId: string, itemId: string): Promise<Result<void>> {
    return safeCall(async () => {
      await db.delete(kanbanChecklistItems)
        .where(and(eq(kanbanChecklistItems.checklistId, checklistId), eq(kanbanChecklistItems.id, itemId)));
    });
  }

  async toggleChecklistItem(itemId: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.update(kanbanChecklistItems)
        .set({ isCompleted: sql<boolean>`NOT ${kanbanChecklistItems.isCompleted}` })
        .where(eq(kanbanChecklistItems.id, itemId))
        .returning();
      return row ?? { id: itemId };
    });
  }

  // ─── Comments ─────────────────────────────────────────────────────────────

  async getCardComments(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT
          c.id, c.card_id, c.user_id,
          c.content AS message,
          'user'    AS "messageType",
          c.created_at,
          CASE WHEN u.id IS NOT NULL THEN jsonb_build_object(
            'id',              u.id,
            'fullName',        COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email, 'Foydalanuvchi'),
            'profileImageUrl', u.profile_image_url
          ) ELSE NULL END AS "user"
        FROM kanban_card_comments c
        LEFT JOIN users u ON u.id = c.user_id
        WHERE c.card_id = ${cardId}
        ORDER BY c.created_at ASC
      `);
      return rows.rows;
    });
  }

  async addComment(cardId: string, userId: number, content: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.insert(kanbanCardComments).values({ cardId, userId, content }).returning();
      if (!row) throw new Error("Izoh qo'shishda xato");
      // Return with user info so the frontend can display immediately without re-fetch
      const userRows = await runQuery<Record<string, unknown>>(sql`
        SELECT id,
          COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), email, 'Foydalanuvchi') AS "fullName",
          profile_image_url AS "profileImageUrl"
        FROM users WHERE id = ${userId}
      `);
      return {
        ...row,
        message: content,
        messageType: 'user',
        user: userRows.rows[0] ?? null,
      };
    });
  }

  // ─── Watchers ─────────────────────────────────────────────────────────────

  async getCardWatchers(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => db.select().from(kanbanCardWatchers)
      .where(eq(kanbanCardWatchers.cardId, cardId)));
  }

  async addWatcher(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.insert(kanbanCardWatchers).values({ cardId, userId }).returning();
      if (!row) throw new Error("Kuzatuvchi qo'shishda xato");
      return row;
    });
  }

  // ─── Card creation (flat endpoint) ────────────────────────────────────────

  async createCardFlat(data: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const boardId     = String(data.boardId   ?? data.board_id   ?? '');
      const columnId    = String(data.columnId  ?? data.column_id  ?? '');
      const title       = String(data.title     ?? 'Yangi vazifa');
      const description = data.description ? String(data.description) : null;
      const priority    = String(data.priority  ?? 'normal');
      const rows = await runQuery<Record<string, unknown>>(sql`
        INSERT INTO kanban_cards
          (board_id, column_id, title, description, priority, sort_order)
        VALUES
          (${boardId}, ${columnId}, ${title}, ${description}, ${priority}, 0)
        RETURNING *
      `);
      if (!rows.rows[0]) throw new Error('Karta yaratishda xato');
      return rows.rows[0];
    });
  }

  // ─── Accept / Complete ────────────────────────────────────────────────────

  async acceptCard(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        UPDATE kanban_cards
        SET accepted_at = NOW(), accepted_by_id = ${String(userId)}, updated_at = NOW()
        WHERE id = ${cardId} AND deleted_at IS NULL
        RETURNING id, title, accepted_at, accepted_by_id, column_id, owner_user_id
      `);
      if (!rows.rows[0]) throw new Error('Karta topilmadi');
      // Egasiga bildirishnoma
      const card = rows.rows[0];
      if (card.owner_user_id && Number(card.owner_user_id) !== userId) {
        await db.insert(kanbanNotifications).values({
          userId: Number(card.owner_user_id),
          cardId,
          type: 'status_changed',
          title: `"${String(card.title)}" qabul qilindi`,
          message: `Karta ${userId}-foydalanuvchi tomonidan qabul qilindi`,
        });
      }
      return castTo<Record<string, unknown>>(rows.rows[0]);
    });
  }

  async completeCard(cardId: string, userId: number, completionReport?: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        UPDATE kanban_cards
        SET completed_at = NOW(),
            completion_report = ${completionReport ?? null},
            updated_at = NOW()
        WHERE id = ${cardId} AND deleted_at IS NULL
        RETURNING id, title, completed_at, column_id, owner_user_id
      `);
      if (!rows.rows[0]) throw new Error('Karta topilmadi');
      const card = rows.rows[0];
      if (card.owner_user_id && Number(card.owner_user_id) !== userId) {
        await db.insert(kanbanNotifications).values({
          userId: Number(card.owner_user_id),
          cardId,
          type: 'status_changed',
          title: `"${String(card.title)}" yakunlandi`,
          message: completionReport ?? 'Karta muvaffaqiyatli yakunlandi',
        });
      }
      return castTo<Record<string, unknown>>(rows.rows[0]);
    });
  }
}
