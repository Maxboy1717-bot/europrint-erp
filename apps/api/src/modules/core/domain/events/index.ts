/**
 * @module index
 * @description Barrel re-export file. Surfaces the public API of this folder.
 */

export class DepartmentCreatedEvent {
  readonly eventName = 'DepartmentCreated';
  constructor(
    readonly departmentId: string,
    readonly name: string,
    readonly code: string,
    readonly occurredAt: Date = new Date(),
  ) {}
}

export class DepartmentRenamedEvent {
  readonly eventName = 'DepartmentRenamed';
  constructor(
    readonly departmentId: string,
    readonly oldName: string,
    readonly newName: string,
    readonly occurredAt: Date = new Date(),
  ) {}
}

export class PanelCreatedEvent {
  readonly eventName = 'PanelCreated';
  constructor(
    readonly panelId: string,
    readonly userId: string,
    readonly name: string,
    readonly occurredAt: Date = new Date(),
  ) {}
}

export class PanelRenamedEvent {
  readonly eventName = 'PanelRenamed';
  constructor(
    readonly panelId: string,
    readonly oldName: string,
    readonly newName: string,
    readonly occurredAt: Date = new Date(),
  ) {}
}

export class PositionCreatedEvent {
  readonly eventName = 'PositionCreated';
  constructor(
    readonly positionId: string,
    readonly title: string,
    readonly code: string,
    readonly occurredAt: Date = new Date(),
  ) {}
}

export class PositionRenamedEvent {
  readonly eventName = 'PositionRenamed';
  constructor(
    readonly positionId: string,
    readonly oldTitle: string,
    readonly newTitle: string,
    readonly occurredAt: Date = new Date(),
  ) {}
}
