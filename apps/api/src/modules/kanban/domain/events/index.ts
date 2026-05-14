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
