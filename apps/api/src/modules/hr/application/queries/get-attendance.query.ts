/**
 * @module get-attendance.query
 * @description Source module. See exports for details.
 */

export class GetAttendanceQuery {
  constructor(public readonly employeeId: string,
    public readonly period: string) {}
}
