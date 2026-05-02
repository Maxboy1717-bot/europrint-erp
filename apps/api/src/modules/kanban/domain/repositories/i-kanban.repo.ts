import { Result } from '@common/types/result.type';
import { KanbanTask } from '../aggregates/kanban-task.aggregate';

export interface IKanbanRepo {
  findById(id: string): Promise<Result<KanbanTask | null>>;
  findAll(filters: {
    status?: string;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: KanbanTask[]; total: number }>>;
  findByAssignee(assigneeId: string): Promise<Result<KanbanTask[]>>;
  save(task: KanbanTask): Promise<Result<KanbanTask>>;
  update(id: string, data: Partial<KanbanTask>): Promise<Result<KanbanTask>>;
  delete(id: string): Promise<Result<void>>;
}

export const KANBAN_REPO = Symbol('KANBAN_REPO');
