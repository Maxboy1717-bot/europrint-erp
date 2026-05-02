export class GetPayrollQuery {
  constructor(public readonly filters: {
      employeeId?: string;
      period?: string;
      status?: string;
    }) {}
}
