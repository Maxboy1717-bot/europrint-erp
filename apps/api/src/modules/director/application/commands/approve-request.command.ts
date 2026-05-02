export class ApproveRequestCommand {
  constructor(public readonly id: string,
    public readonly userId: string,
    public readonly notes?: string) {}
}
