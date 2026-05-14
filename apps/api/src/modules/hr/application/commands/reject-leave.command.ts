/**
 * @module reject-leave.command
 * @description Source module. See exports for details.
 */

export class RejectLeaveCommand {
  constructor(public readonly leaveId: string,
    public readonly rejectorId: string,
    public readonly reason: string) {}
}
