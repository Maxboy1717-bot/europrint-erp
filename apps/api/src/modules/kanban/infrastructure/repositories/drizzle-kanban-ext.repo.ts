import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, desc, lt, ne, isNotNull, sql } from 'drizzle-orm';
import { db, kanban_tasks } from '@shared/db';
import { safeCall, Result } from '@common/result';
import {
  kanbanFlows, kanbanRobots, kanbanChecklists, kanbanChecklistItems,
  kanbanCardComments, kanbanCardWatchers,
} from '@europrint/schemas';

const COUNT_EXPR = sql<number>`count(*)::int`;

@Injectable()
export class DrizzleKanbanExtRepository {
  private readonly logger = new Logger(DrizzleKanbanExtRepository.name);

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

  async updateBoardFlows(boardId: string, name: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      await db.update(kanbanFlows)
        .set({ name, updatedAt: _time.now() })
        .where(eq(kanbanFlows.boardId, boardId));
      return { boardId, name, updatedAt: _time.now().toISOString() };
    });
  }

  async deleteBoardFlows(boardId: string): Promise<Result<void>> {
    return safeCall(async () => { await db.delete(kanbanFlows).where(eq(kanbanFlows.boardId, boardId)); });
  }

  async getCardChecklists(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => db.select().from(kanbanChecklists)
      .where(eq(kanbanChecklists.cardId, cardId))
      .orderBy(kanbanChecklists.position));
  }

  async createChecklist(cardId: string, title: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.insert(kanbanChecklists).values({ cardId, title }).returning();
      if (!row) throw new Error('Cheklistni yaratishda xato: natija qaytmadi');
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
      if (!row) throw new Error('Checklist elementi yaratishda xato: natija qaytmadi');
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

  async getCardComments(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => db.select().from(kanbanCardComments)
      .where(eq(kanbanCardComments.cardId, cardId))
      .orderBy(desc(kanbanCardComments.createdAt)));
  }

  async addComment(cardId: string, userId: number, content: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.insert(kanbanCardComments).values({ cardId, userId, content }).returning();
      if (!row) throw new Error('Izoh qo\'shishda xato: natija qaytmadi');
      return row;
    });
  }

  async getCardWatchers(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => db.select().from(kanbanCardWatchers)
      .where(eq(kanbanCardWatchers.cardId, cardId)));
  }

  async addWatcher(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.insert(kanbanCardWatchers).values({ cardId, userId }).returning();
      if (!row) throw new Error('Kuzatuvchi qo\'shishda xato: natija qaytmadi');
      return row;
    });
  }

  async getSprintInfo(): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const active = await db.select({ count: COUNT_EXPR }).from(kanban_tasks)
        .where(ne(kanban_tasks.status, 'done'));
      const done = await db.select({ count: COUNT_EXPR }).from(kanban_tasks)
        .where(eq(kanban_tasks.status, 'done'));
      return {
        activeSprint: { totalCards: Number(active[0]?.count ?? 0), completedCards: Number(done[0]?.count ?? 0) },
        upcomingSprints: [],
        completedSprints: [],
      };
    });
  }

  async getMembers(): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await db.selectDistinct({ assignedTo: kanban_tasks.assigned_to })
        .from(kanban_tasks)
        .where(isNotNull(kanban_tasks.assigned_to));
      return (rows ?? []).map((r) => ({ userId: r.assignedTo }));
    });
  }

  async getOverdueCards(): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => db.select().from(kanban_tasks)
      .where(and(lt(kanban_tasks.due_date, _time.now()), ne(kanban_tasks.status, 'done')))
      .orderBy(kanban_tasks.due_date));
  }

  async getCardsByEmployee(employeeId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => db.select().from(kanban_tasks)
      .where(eq(kanban_tasks.assigned_to, employeeId)));
  }

  async getProductivityReport(): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const total = await db.select({ count: COUNT_EXPR }).from(kanban_tasks);
      const done  = await db.select({ count: COUNT_EXPR }).from(kanban_tasks)
        .where(eq(kanban_tasks.status, 'done'));
      return {
        period: 'all',
        totalCards:     Number(total[0]?.count ?? 0),
        completedCards: Number(done[0]?.count ?? 0),
        generatedAt: _time.now().toISOString(),
      };
    });
  }

  async getOverdueReport(): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const rows = await db.select().from(kanban_tasks)
        .where(and(lt(kanban_tasks.due_date, _time.now()), ne(kanban_tasks.status, 'done')))
        .orderBy(kanban_tasks.due_date);
      return { overdueCards: rows, totalOverdue: rows.length, generatedAt: _time.now().toISOString() };
    });
  }

  async getAnalyticsSummary(): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const total = await db.select({ count: COUNT_EXPR }).from(kanban_tasks);
      const done  = await db.select({ count: COUNT_EXPR }).from(kanban_tasks)
        .where(eq(kanban_tasks.status, 'done'));
      return {
        totalCards:     Number(total[0]?.count ?? 0),
        completedCards: Number(done[0]?.count ?? 0),
        overdueCards: 0,
        activeUsers: 0,
      };
    });
  }

  async getEmployeePerformance(): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const total = await db.select({ count: COUNT_EXPR }).from(kanban_tasks);
      const done  = await db.select({ count: COUNT_EXPR }).from(kanban_tasks)
        .where(eq(kanban_tasks.status, 'done'));
      return {
        employees: [],
        totalCards:     Number(total[0]?.count ?? 0),
        completedCards: Number(done[0]?.count ?? 0),
        generatedAt: _time.now().toISOString(),
      };
    });
  }
}
