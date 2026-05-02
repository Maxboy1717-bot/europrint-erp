export class CreateTaskCommand {
  constructor(readonly title: string,
    readonly description: string,
    readonly boardId: string,
    readonly createdBy: number,
    readonly priority?: string) {}
}

export class MoveTaskCommand {
  constructor(
    readonly taskId: string,
    readonly toStatus: string,
  ) {}
}

export class AssignTaskCommand {
  constructor(
    readonly taskId: string,
    readonly assigneeId: number,
  ) {}
}
