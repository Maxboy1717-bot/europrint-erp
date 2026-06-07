/**
 * @module get-budget-by-id.query
 * @description CQRS query: fetch a single budgets row by id.
 */

export class GetBudgetByIdQuery {
  constructor(public readonly id: string) {}
}
