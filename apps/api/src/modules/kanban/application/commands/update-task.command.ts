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
