/**
 * @module drizzle-kanban-flows-robots.repo
 * @description Flows, Robots & Board-level sub-repository — split out of
 *   `DrizzleKanbanCoreRepository` to keep individual files under 300 lines
 *   (Rule 16). Public method names preserved; the parent repo delegates.
 *
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - Soft-delete UPDATE with composite predicate (id = X AND deleted_at IS NULL)
 *     against the `kanban_boards` table which is not part of this repo's
 *     Drizzle schema surface (board-level mutation reaches across module
 *     boundary; using sql preserves the schema isolation)
 *   - SET deleted_at = NOW() server-side timestamp on soft-delete
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { and, eq, desc, sql } from 'drizzle-orm';
import { db, runQuery } from '@shared/db';
import { kanbanFlows, kanbanRobots } from '@shared/db';
import { safeCall, Result } from '@common/result';

@Injectable()
export class DrizzleKanbanFlowsRobotsRepository {

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
}
