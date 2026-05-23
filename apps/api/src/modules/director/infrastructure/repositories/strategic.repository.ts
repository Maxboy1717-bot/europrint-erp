/**
 * @module strategic.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (Director)
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { sql, eq, and, asc, desc } from 'drizzle-orm';
import { db } from '@shared/db';
import { strategic_categories, strategic_tasks, strategic_milestones } from '@shared/db';
import { safeCall, Result } from '@common/result';
import type { IStrategicRepo } from '../../domain/repositories/i-strategic.repo';

type Row = Record<string, unknown>;

@Injectable()
export class StrategicRepository implements IStrategicRepo {
  async listCategories(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select().from(strategic_categories).orderBy(strategic_categories.name).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async createCategory(name: string, description: string | null, color: string): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(strategic_categories).values({ name, description, color, code: name.toLowerCase().replace(/\s+/g, '-') }).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async updateCategory(id: number, name: string | null, description: string | null, color: string | null): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(strategic_categories).set({
        name:        sql`COALESCE(${name}, ${strategic_categories.name})`,
        description: sql`COALESCE(${description}, ${strategic_categories.description})`,
        color:       sql`COALESCE(${color}, ${strategic_categories.color})`,
      }).where(eq(strategic_categories.id, id)).returning();
      return (rows[0] ?? { message: 'Yangilandi' }) as Row;
      }, 'DB_ERROR');
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(strategic_categories).where(eq(strategic_categories.id, id));
  }

  async listTasks(status: string | null, categoryId: number | null, assigneeId: number | null, lim: number, off: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const conds = [];
      if (status !== null)     conds.push(eq(strategic_tasks.status, status));
      if (categoryId !== null) conds.push(eq(strategic_tasks.categoryId, String(categoryId)));
      if (assigneeId !== null) conds.push(eq(strategic_tasks.assignedUserId, String(assigneeId)));
      const where = conds.length > 0 ? and(...conds) : undefined;

      return db.select({
        id:            strategic_tasks.id,
        title:         strategic_tasks.title,
        category_id:   strategic_tasks.categoryId,
        assignee_id:   strategic_tasks.assignedUserId,
        due_date:      strategic_tasks.targetDate,
        priority:      strategic_tasks.priority,
        description:   strategic_tasks.description,
        status:        strategic_tasks.status,
        progress:      strategic_tasks.progressPercent,
        created_at:    strategic_tasks.createdAt,
        updated_at:    strategic_tasks.updatedAt,
        category_name: strategic_categories.name,
        assignee_name: sql<string>`COALESCE((SELECT u.first_name || ' ' || u.last_name FROM users u WHERE u.id = ${strategic_tasks.assignedUserId}), '')`,
      })
        .from(strategic_tasks)
        .leftJoin(strategic_categories, eq(strategic_categories.id, strategic_tasks.categoryId))
        .where(where)
        .orderBy(asc(strategic_tasks.targetDate), desc(strategic_tasks.createdAt))
        .limit(lim)
        .offset(off).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async getTask(id: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select({
        id:            strategic_tasks.id,
        title:         strategic_tasks.title,
        category_id:   strategic_tasks.categoryId,
        assignee_id:   strategic_tasks.assignedUserId,
        due_date:      strategic_tasks.targetDate,
        priority:      strategic_tasks.priority,
        description:   strategic_tasks.description,
        status:        strategic_tasks.status,
        progress:      strategic_tasks.progressPercent,
        created_at:    strategic_tasks.createdAt,
        category_name: strategic_categories.name,
        assignee_name: sql<string>`COALESCE((SELECT u.first_name || ' ' || u.last_name FROM users u WHERE u.id = ${strategic_tasks.assignedUserId}), '')`,
      })
        .from(strategic_tasks)
        .leftJoin(strategic_categories, eq(strategic_categories.id, strategic_tasks.categoryId))
        .where(eq(strategic_tasks.id, id)).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async createTask(title: string, categoryId: number | null, assigneeId: number | null, dueDate: string | null, priority: string, description: string | null, createdBy: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(strategic_tasks).values({
        title,
        taskNumber:      0,
        categoryId:      categoryId ? String(categoryId) : undefined,
        assignedUserId:  assigneeId ? String(assigneeId) : undefined,
        targetDate:      dueDate ?? undefined,
        priority,
        description,
        status:          'planned',
      }).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async updateTask(id: number, title: string | null, status: string | null, assigneeId: number | null, dueDate: string | null, priority: string | null, description: string | null, progress: number | null): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(strategic_tasks).set({
        title:           sql`COALESCE(${title}, ${strategic_tasks.title})`,
        status:          sql`COALESCE(${status}, ${strategic_tasks.status})`,
        assignedUserId:  sql`COALESCE(${assigneeId}::text, ${strategic_tasks.assignedUserId})`,
        targetDate:      sql`COALESCE(${dueDate}::varchar, ${strategic_tasks.targetDate})`,
        priority:        sql`COALESCE(${priority}, ${strategic_tasks.priority})`,
        description:     sql`COALESCE(${description}, ${strategic_tasks.description})`,
        progressPercent: sql`COALESCE(${progress}::int, ${strategic_tasks.progressPercent})`,
        updatedAt:       _time.now(),
      }).where(eq(strategic_tasks.id, id)).returning();
      return (rows[0] ?? { message: 'Yangilandi' }) as Row;
      }, 'DB_ERROR');
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(strategic_tasks).where(eq(strategic_tasks.id, id));
  }

  async createMilestone(taskId: number, title: string, dueDate: string | null, description: string | null): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(strategic_milestones).values({
        taskId:      String(taskId),
        title,
        targetDate:  dueDate ?? undefined,
        status:      'pending',
      }).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async updateMilestone(id: number, title: string | null, status: string | null, dueDate: string | null): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(strategic_milestones).set({
        title:      sql`COALESCE(${title}, ${strategic_milestones.title})`,
        status:     sql`COALESCE(${status}, ${strategic_milestones.status})`,
        targetDate: sql`COALESCE(${dueDate}::varchar, ${strategic_milestones.targetDate})`,
      }).where(eq(strategic_milestones.id, id)).returning();
      return (rows[0] ?? { message: 'Yangilandi' }) as Row;
      }, 'DB_ERROR');
  }

  async getDashboardTasksStats(): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      return db.select({ status: strategic_tasks.status, cnt: sql<number>`COUNT(*)` })
        .from(strategic_tasks).groupBy(strategic_tasks.status).then(r => castTo<unknown[]>(r));
      }, 'DB_ERROR');
  }

  async getDashboardCategories(): Promise<Result<unknown[]>> {
    return safeCall(async () => {
      return db.select({
        id:         strategic_categories.id,
        name:       strategic_categories.name,
        color:      strategic_categories.color,
        task_count: sql<number>`COUNT(${strategic_tasks.id})`,
      })
        .from(strategic_categories)
        .leftJoin(strategic_tasks, eq(strategic_tasks.categoryId, strategic_categories.id))
        .groupBy(strategic_categories.id)
        .orderBy(strategic_categories.name).then(r => castTo<unknown[]>(r));
      }, 'DB_ERROR');
  }
}
