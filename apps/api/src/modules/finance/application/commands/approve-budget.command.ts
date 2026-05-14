/**
 * @module approve-budget.command
 * @description Source module. See exports for details.
 */

export class ApproveBudgetCommand {
  constructor(public readonly budgetId: string,
    public readonly userId: string) {}
}
