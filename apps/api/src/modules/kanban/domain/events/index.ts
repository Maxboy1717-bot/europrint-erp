/**
 * @module index
 * @description Barrel re-export file. Surfaces the public API of this folder.
 */

export class TaskCreatedEvent {
  constructor(readonly taskId: string,
    readonly boardId: string,
    readonly title: string) {}
}

export class TaskMovedEvent {
  constructor(
    readonly taskId: string,
    readonly fromStatus: string,
    readonly toStatus: string,
  ) {}
}

export class TaskAssignedEvent {
  constructor(
    readonly taskId: string,
    readonly assigneeId: number,
  ) {}
}

export class KanbanTaskMovedEvent {
  readonly eventName = 'KanbanTaskMoved';
  constructor(
    readonly taskId: string,
    readonly targetColumnId: number,
    readonly by: number,
    readonly occurredAt: Date = new Date(),
  ) {}
}

export class KanbanTaskAssignedEvent {
  readonly eventName = 'KanbanTaskAssigned';
  constructor(
    readonly taskId: string,
    readonly userId: number,
    readonly by: number,
    readonly occurredAt: Date = new Date(),
  ) {}
}

export class KanbanTaskCompletedEvent {
  readonly eventName = 'KanbanTaskCompleted';
  constructor(
    readonly taskId: string,
    readonly by: number,
    readonly occurredAt: Date = new Date(),
  ) {}
}
