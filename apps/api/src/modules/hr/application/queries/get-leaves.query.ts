/**
 * @module get-leaves.query
 * @description Source module. See exports for details.
 */

export class GetLeavesQuery {
  constructor(public readonly employeeId?: string,
    public readonly status?: string,
    public readonly leaveType?: string,
    public readonly page: number = 1,
    public readonly limit: number = 10) {}
}
