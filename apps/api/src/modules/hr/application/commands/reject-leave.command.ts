export class RejectLeaveCommand {
  constructor(public readonly leaveId: string,
    public readonly rejectorId: string,
    public readonly reason: string) {}
}
