/**
 * @module cancel-leave.command
 * @description Source module. See exports for details.
 */

export class CancelLeaveCommand {
  constructor(public readonly leaveId: string,
    public readonly cancellerId: string) {}
}
