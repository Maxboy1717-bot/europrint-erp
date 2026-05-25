/**
 * @module kanban-task.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { v4 as uuid } from 'uuid';
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { Ok, Err, AppErr, Result } from '@common/result';
import { TaskStatus, TaskPriority } from '../enums/task-status.enum';
import {
  KanbanTaskMovedEvent,
  KanbanTaskAssignedEvent,
  KanbanTaskCompletedEvent,
} from '../events';

export class KanbanTask extends AggregateRoot {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: number | null;
  boardId: string;
  columnId: number | null;
  createdBy: number;
  dueDate: Date | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;

  constructor(
    title: string,
    description: string,
    boardId: string,
    createdBy: number,
    priority: TaskPriority = TaskPriority.MEDIUM,
  ) {
    super();
    this.id = uuid();
    this.title = title;
    this.description = description;
    this.status = TaskStatus.BACKLOG;
    this.priority = priority;
    this.assigneeId = null;
    this.boardId = boardId;
    this.columnId = null;
    this.createdBy = createdBy;
    this.dueDate = null;
    this.tags = [];
    this.createdAt = _time.now();
    this.updatedAt = _time.now();
    this.completedAt = null;
  }

  assign(assigneeId: number): void {
    this.assigneeId = assigneeId;
    this.updatedAt = _time.now();
  }

  moveToStatus(status: TaskStatus): void {
    this.status = status;
    this.updatedAt = _time.now();
  }

  addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  setDueDate(dueDate: Date): void {
    this.dueDate = dueDate;
    this.updatedAt = _time.now();
  }

  moveToColumn(targetColumnId: number, by: number): Result<void> {
    if (!Number.isInteger(targetColumnId) || targetColumnId <= 0) {
      return Err(AppErr('VALIDATION', 'targetColumnId must be a positive integer'));
    }
    if (this.status === TaskStatus.DONE) {
      return Err(AppErr('BUSINESS_RULE_VIOLATION', 'Cannot move a completed task'));
    }
    this.columnId = targetColumnId;
    this.updatedAt = _time.now();
    this.addDomainEvent(new KanbanTaskMovedEvent(this.id, targetColumnId, by));
    return Ok<void>();
  }

  assignTo(userId: number, by: number): Result<void> {
    if (!Number.isInteger(userId) || userId <= 0) {
      return Err(AppErr('VALIDATION', 'userId must be a positive integer'));
    }
    if (this.assigneeId === userId) {
      return Err(AppErr('BUSINESS_RULE_VIOLATION', 'Task is already assigned to this user'));
    }
    this.assigneeId = userId;
    this.updatedAt = _time.now();
    this.addDomainEvent(new KanbanTaskAssignedEvent(this.id, userId, by));
    return Ok<void>();
  }

  complete(by: number): Result<void> {
    if (this.status === TaskStatus.DONE) {
      return Err(AppErr('BUSINESS_RULE_VIOLATION', 'Task is already completed'));
    }
    this.status = TaskStatus.DONE;
    this.completedAt = _time.now();
    this.updatedAt = _time.now();
    this.addDomainEvent(new KanbanTaskCompletedEvent(this.id, by));
    return Ok<void>();
  }

  static create(
    title: string,
    description: string,
    boardId: string,
    createdBy: number,
    priority?: TaskPriority,
  ): KanbanTask {
    return new KanbanTask(title, description, boardId, createdBy, priority);
  }
}
