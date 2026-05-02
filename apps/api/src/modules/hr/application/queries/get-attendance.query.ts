export class GetAttendanceQuery {
  constructor(public readonly employeeId: string,
    public readonly period: string) {}
}
