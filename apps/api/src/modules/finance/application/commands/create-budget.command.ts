export interface BudgetLineInput {
  category: string;
  description: string;
  plannedAmount: number;
}

export class CreateBudgetCommand {
  constructor(public readonly name: string,
    public readonly fiscalYear: number,
    public readonly quarter: number | null,
    public readonly department: string | null,
    public readonly lines: BudgetLineInput[],
    public readonly notes: string | null,
    public readonly userId: string) {}
}
