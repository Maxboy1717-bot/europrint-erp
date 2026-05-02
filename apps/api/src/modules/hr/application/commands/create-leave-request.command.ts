export class CreateLeaveRequestCommand {
  constructor(public readonly employeeId: string,
    public readonly userId: string,
    public readonly leaveType: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly reason: string) {}
}
