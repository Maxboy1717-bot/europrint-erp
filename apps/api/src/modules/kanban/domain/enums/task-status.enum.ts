/**
 * @module task-status.enum
 * @description Kanban status enums.
 *
 *   ⭐ The OWNER-CANONICAL 4-stage model lives in `../kanban-status.ts`
 *   ({@link KanbanStatus}: reja/jarayonda/tekshiruvda/bajarildi — EP-KAN-015).
 *   It is re-exported here for convenience.
 *
 *   The legacy `TaskStatus` enum below (backlog/todo/in_progress/review/done) is
 *   the OLD model used only by the dead CQRS `kanban_tasks` slice. It is kept as
 *   accepted aliases (see STATUS_ALIASES in kanban-status.ts) so old codes/rows
 *   are never orphaned, but new work must use {@link KanbanStatus}.
 */

export { KanbanStatus, KANBAN_STATUS_ORDER, statusFromColumnName, isDoneColumn } from '../kanban-status';

/** @deprecated Legacy 5-state model (dead kanban_tasks slice). Use KanbanStatus. */
export enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo', // #339 kanban status enum qiymati
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}
