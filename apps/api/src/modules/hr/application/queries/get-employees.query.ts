/**
 * @module get-employees.query
 * @description Source module. See exports for details.
 */

export class GetEmployeesQuery {
  constructor(public readonly filters: {
      department?: string;
      status?: string;
      page?: number;
      limit?: number;
    }) {}
}
