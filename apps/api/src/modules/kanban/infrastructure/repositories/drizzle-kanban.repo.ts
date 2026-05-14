/**
 * @module drizzle-kanban.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, desc , sql } from 'drizzle-orm';
import { Result, Err , Ok } from '@common/types/result.type';
import { IKanbanRepo } from '../../domain/repositories/i-kanban.repo';
import { KanbanTask } from '../../domain/aggregates/kanban-task.aggregate';
import { TaskStatus, TaskPriority } from '../../domain/enums/task-status.enum';
import { db, kanban_tasks } from '@shared/db';
import { safeJsonParse } from '@shared/utils/safe-json';

@Injectable()
export class DrizzleKanbanRepository implements IKanbanRepo {
  private readonly logger = new Logger(DrizzleKanbanRepository.name);

  constructor() {}

  async findById(id: string): Promise<Result<KanbanTask | null>> {
    return db
      .select()
      .from(kanban_tasks)
      .where(sql`${kanban_tasks.id} = ${id} AND ${kanban_tasks.deleted_at} IS NULL`)
      .execute()
      .then((rows) => {
        if (rows.length === 0) {
          return Ok(null);
        }
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error finding kanban task by id');
        return Err((error as Error).message);
      });
  }

  async findAll(filters: {
    status?: string;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: KanbanTask[]; total: number }>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    return Promise.all([
      db
        .select()
        .from(kanban_tasks)
        .where(
          and(
            sql`${kanban_tasks.deleted_at} IS NULL`,
            filters.status ? sql`${kanban_tasks.status} = ${filters.status}` : undefined,
            filters.assignedTo ? sql`${kanban_tasks.assigned_to} = ${filters.assignedTo}` : undefined))
        .orderBy(desc(kanban_tasks.created_at))
        .limit(limit)
        .offset(offset)
        .execute()
        .catch((error) => {
          this.logger.error('Error fetching kanban tasks');
          throw error;
        }),
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(kanban_tasks)
        .where(
          and(
            sql`${kanban_tasks.deleted_at} IS NULL`,
            filters.status ? sql`${kanban_tasks.status} = ${filters.status}` : undefined,
            filters.assignedTo ? sql`${kanban_tasks.assigned_to} = ${filters.assignedTo}` : undefined))
        .execute()
        .then((rows) => Number(rows[0]?.count ?? 0))
        .catch((error) => {
          this.logger.error('Error counting kanban tasks');
          throw error;
        }),
    ])
      .then(([items, total]) => (Ok({ items: (Array.isArray(items) ? items : []).map((row) => this.toDomain(row)), total })))
      .catch((error) => {
        return Err((error as Error).message);
      });
  }

  async findByAssignee(assigneeId: string): Promise<Result<KanbanTask[]>> {
    return db
      .select()
      .from(kanban_tasks)
      .where(eq(kanban_tasks.assigned_to, assigneeId))
      .orderBy(desc(kanban_tasks.created_at))
      .execute()
      .then((rows) => (Ok((Array.isArray(rows) ? rows : []).map((row) => this.toDomain(row)),)))
      .catch((error) => {
        this.logger.error('Error finding kanban tasks by assignee');
        return Err((error as Error).message);
      });
  }

  async save(task: KanbanTask): Promise<Result<KanbanTask>> {
    return db
      .insert(kanban_tasks)
      .values({ id: task.id, title: task.title, description: task.description, status: task.status, priority: task.priority,
        assigned_to: task.assigneeId,
        due_date: task.dueDate,
        tags: JSON.stringify(task.tags),
        created_by: task.createdBy.toString(),
        created_at: task.createdAt,
        updated_at: task.updatedAt,
      } as typeof kanban_tasks.$inferInsert)
      .returning()
      .execute()
      .then((rows) => {
        if (rows.length === 0) {
          return Err('Failed to save kanban task');
        }
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error saving kanban task');
        return Err((error as Error).message);
      });
  }

  async update(id: string, data: Partial<KanbanTask>): Promise<Result<KanbanTask>> {
    const updateData: Record<string, unknown> = {};

    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;
    if (data.assigneeId !== undefined) updateData.assigned_to = data.assigneeId;
    if (data.dueDate) updateData.due_date = data.dueDate;
    if (data.tags) updateData.tags = JSON.stringify(data.tags);

    updateData.updated_at = _time.now();

    return db
      .update(kanban_tasks)
      .set(updateData)
      .where(sql`${kanban_tasks.id} = ${id}`)
      .returning()
      .execute()
      .then((rows) => {
        if (rows.length === 0) {
          return Err('Kanban task not found');
        }
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error updating kanban task');
        return Err((error as Error).message);
      });
  }

  async delete(id: string): Promise<Result<void>> {
    return db
      .update(kanban_tasks)
      .set({ deleted_at: new Date() } as Partial<typeof kanban_tasks.$inferInsert>)
      .where(sql`${kanban_tasks.id} = ${id} AND ${kanban_tasks.deleted_at} IS NULL`)
      .execute()
      .then(() => {
        return Ok(undefined);
      })
      .catch((error) => {
        this.logger.error('Error soft-deleting kanban task');
        return Err((error as Error).message);
      });
  }

  private toDomain(row: Record<string, unknown>): KanbanTask {
    const task = new KanbanTask(
      String(row.title ?? ''),
      String(row.description ?? ''),
      'default-board', // boardId not in schema
      parseInt(String(row.created_by)) || 0,
      row.priority as TaskPriority);

    task.id = String(row.id ?? '');
    task.status = row.status as TaskStatus;
    task.assigneeId = row.assigned_to ? parseInt(String(row.assigned_to)) : null;
    task.dueDate = row.due_date ? new Date(String(row.due_date)) : null;
    task.tags = safeJsonParse<string[]>(row.tags ? String(row.tags) : null, []);
    task.createdAt = row.created_at ? new Date(String(row.created_at)) : _time.now();
    task.updatedAt = row.updated_at ? new Date(String(row.updated_at)) : _time.now();

    return task;
  }
}
