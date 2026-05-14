/**
 * @module get-payroll.query
 * @description Source module. See exports for details.
 */

export class GetPayrollQuery {
  constructor(public readonly filters: {
      employeeId?: string;
      period?: string;
      status?: string;
    }) {}
}
