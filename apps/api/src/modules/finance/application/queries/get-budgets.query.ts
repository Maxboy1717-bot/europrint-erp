export class GetBudgetsQuery {
  constructor(public readonly fiscalYear?: number,
    public readonly status?: string,
    public readonly department?: string,
    public readonly page: number = 1,
    public readonly limit: number = 10) {}
}
