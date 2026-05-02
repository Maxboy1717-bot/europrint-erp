export class ApproveBudgetCommand {
  constructor(public readonly budgetId: string,
    public readonly userId: string) {}
}
