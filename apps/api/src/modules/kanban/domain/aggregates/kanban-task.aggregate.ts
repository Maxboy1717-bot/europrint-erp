import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { v4 as uuid } from 'uuid';
import { AggregateRoot } from '@nestjs/cqrs';
import { TaskStatus, TaskPriority } from '../enums/task-status.enum';

export class KanbanTask extends AggregateRoot {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: number | null;
  boardId: string;
  createdBy: number;
  dueDate: Date | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;

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
    this.createdBy = createdBy;
    this.dueDate = null;
    this.tags = [];
    this.createdAt = _time.now();
    this.updatedAt = _time.now();
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
