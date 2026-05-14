/**
 * @module create-leave-request.command
 * @description Source module. See exports for details.
 */

export class CreateLeaveRequestCommand {
  constructor(public readonly employeeId: string,
    public readonly userId: string,
    public readonly leaveType: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly reason: string) {}
}
