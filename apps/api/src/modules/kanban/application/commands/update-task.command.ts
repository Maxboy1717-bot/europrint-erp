/**
 * @module update-task.command
 * @description Source module. See exports for details.
 */

export class UpdateTaskCommand {
  constructor(public readonly id: string,
    public readonly status?: string,
    public readonly title?: string,
    public readonly description?: string,
    public readonly assignedTo?: string,
    public readonly priority?: string,
    public readonly dueDate?: Date,
    public readonly userId?: string) {}
}
