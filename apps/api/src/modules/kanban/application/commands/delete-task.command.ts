/**
 * @module delete-task.command
 * @description Source module. See exports for details.
 */

export class DeleteTaskCommand {
  constructor(public readonly id: string,
    public readonly userId: string) {}
}
