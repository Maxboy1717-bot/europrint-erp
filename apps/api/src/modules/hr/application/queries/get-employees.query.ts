/**
 * @module get-employees.query
 * @description Source module. See exports for details.
 */

export class GetEmployeesQuery {
  constructor(public readonly filters: {
      department?: string;
      departmentId?: string;   // camelCase alias from FE
      status?: string;
      search?: string;         // P1.6.4: server-side search
      page?: number;
      limit?: number;
    }) {}
}
