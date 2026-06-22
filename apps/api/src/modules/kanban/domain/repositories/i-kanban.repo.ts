/**
 * @module i-kanban.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/types/result.type';
import { KanbanTask } from '../aggregates/kanban-task.aggregate';

/**
 * Read-only kanban task repository over the canonical `kanban_cards` table.
 * The write methods (save/update/delete) were removed together with the dead
 * `kanban_tasks` write path — card writes flow through the kanban_cards CRUD
 * repo / cards controller (the canonical card path).
 */
export interface IKanbanRepo {
  findById(id: string): Promise<Result<KanbanTask | null>>;
  findAll(filters: {
    status?: string;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: KanbanTask[]; total: number }>>;
  findByAssignee(assigneeId: string): Promise<Result<KanbanTask[]>>;
}

export const KANBAN_REPO = Symbol('KANBAN_REPO');
