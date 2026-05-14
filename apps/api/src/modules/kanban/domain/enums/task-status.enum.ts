/**
 * @module task-status.enum
 * @description Source module. See exports for details.
 */

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
