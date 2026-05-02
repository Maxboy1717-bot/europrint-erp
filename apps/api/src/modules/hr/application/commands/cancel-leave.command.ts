export class CancelLeaveCommand {
  constructor(public readonly leaveId: string,
    public readonly cancellerId: string) {}
}
