export class GetEmployeesQuery {
  constructor(public readonly filters: {
      department?: string;
      status?: string;
      page?: number;
      limit?: number;
    }) {}
}
