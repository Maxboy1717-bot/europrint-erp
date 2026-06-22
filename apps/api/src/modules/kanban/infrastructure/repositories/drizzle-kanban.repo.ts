/**
 * @module drizzle-kanban.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { Result, Err , Ok } from '@common/types/result.type';
import { IKanbanRepo } from '../../domain/repositories/i-kanban.repo';
import { KanbanTask } from '../../domain/aggregates/kanban-task.aggregate';
import { TaskStatus, TaskPriority } from '../../domain/enums/task-status.enum';
import { db, kanban_tasks, runQuery } from '@shared/db';
import { safeJsonParse } from '@shared/utils/safe-json';

/**
 * TWO-WORLD FIX (audit KAN): the live kanban data is in `kanban_cards`
 * (canonical, has rows). The legacy `kanban_tasks` table is a separate, empty
 * schema. READ paths below now query `kanban_cards` so list/detail/assignee
 * queries reflect real data. WRITE paths (save/update/delete) still target
 * `kanban_tasks` and are intentionally out of scope for this read-repoint —
 * real card writes flow through the kanban_cards CRUD repo / cards controller.
 *
 * Column mapping kanban_tasks -> kanban_cards:
 *   id (uuid)        -> id (integer, aliased as text)
 *   assigned_to(uuid)-> owner_user_id (integer)
 *   status (enum)    -> DERIVED from completed_at (NULL='in_progress', else 'done')
 *   created_by(uuid) -> COALESCE(accepted_by_id, owner_user_id, 0)
 *   tags             -> NO column on kanban_cards -> NULL -> [] in toDomain
 */
const KANBAN_CARD_SELECT = sql`
  kc.id::text                                                  AS id,
  kc.title                                                     AS title,
  kc.description                                               AS description,
  kc.priority                                                  AS priority,
  CASE WHEN kc.completed_at IS NOT NULL THEN 'done' ELSE 'in_progress' END AS status,
  kc.owner_user_id                                             AS assigned_to,
  COALESCE(kc.accepted_by_id, kc.owner_user_id, 0)             AS created_by,
  kc.due_date                                                  AS due_date,
  NULL                                                         AS tags,
  kc.created_at                                                AS created_at,
  kc.updated_at                                                AS updated_at
`;

@Injectable()
export class DrizzleKanbanRepository implements IKanbanRepo {
  private readonly logger = new Logger(DrizzleKanbanRepository.name);

  constructor() {}

  async findById(id: string): Promise<Result<KanbanTask | null>> {
    return runQuery<Record<string, unknown>>(sql`
        SELECT ${KANBAN_CARD_SELECT}
        FROM kanban_cards kc
        WHERE kc.id::text = ${id} AND kc.deleted_at IS NULL
      `)
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

    // status filter mapped onto derived completion (kanban_cards has no status col)
    const statusFilter = filters.status
      ? (filters.status === 'done'
          ? sql`AND kc.completed_at IS NOT NULL`
          : sql`AND kc.completed_at IS NULL`)
      : sql``;
    const assigneeFilter = filters.assignedTo
      ? sql`AND kc.owner_user_id::text = ${filters.assignedTo}`
      : sql``;

    return Promise.all([
      runQuery<Record<string, unknown>>(sql`
        SELECT ${KANBAN_CARD_SELECT}
        FROM kanban_cards kc
        WHERE kc.deleted_at IS NULL ${statusFilter} ${assigneeFilter}
        ORDER BY kc.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `)
        .catch((error) => {
          this.logger.error('Error fetching kanban cards');
          throw error;
        }),
      runQuery<{ count: number }>(sql`
        SELECT COUNT(*)::int AS count
        FROM kanban_cards kc
        WHERE kc.deleted_at IS NULL ${statusFilter} ${assigneeFilter}
      `)
        .then((rows) => Number(rows[0]?.count ?? 0))
        .catch((error) => {
          this.logger.error('Error counting kanban cards');
          throw error;
        }),
    ])
      .then(([items, total]) => (Ok({ items: (Array.isArray(items) ? items : []).map((row) => this.toDomain(row)), total })))
      .catch((error) => {
        return Err((error as Error).message);
      });
  }

  async findByAssignee(assigneeId: string): Promise<Result<KanbanTask[]>> {
    return runQuery<Record<string, unknown>>(sql`
        SELECT ${KANBAN_CARD_SELECT}
        FROM kanban_cards kc
        WHERE kc.owner_user_id::text = ${assigneeId} AND kc.deleted_at IS NULL
        ORDER BY kc.created_at DESC
      `)
      .then((rows) => (Ok((Array.isArray(rows) ? rows : []).map((row) => this.toDomain(row)))))
      .catch((error) => {
        this.logger.error('Error finding kanban cards by assignee');
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
