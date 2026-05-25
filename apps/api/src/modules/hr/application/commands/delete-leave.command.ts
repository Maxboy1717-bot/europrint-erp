/**
 * @module delete-leave.command
 * @description CQRS command — soft-delete a leave request.
 */

export class DeleteLeaveCommand {
  constructor(public readonly leaveId: string) {}
}
