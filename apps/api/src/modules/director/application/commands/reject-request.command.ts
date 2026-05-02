export class RejectRequestCommand {
  constructor(public readonly id: string,
    public readonly userId: string,
    public readonly reason: string) {}
}
