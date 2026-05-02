export class DeleteTaskCommand {
  constructor(public readonly id: string,
    public readonly userId: string) {}
}
