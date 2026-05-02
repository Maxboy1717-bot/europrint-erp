import { Result } from '@common/result';
type Row = Record<string, unknown>;
export interface IFinanceBudgetsRepository {
  findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findById(id: number): Promise<Result<Record<string, unknown> | null>>;
  create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  approve(id: number): Promise<Result<Record<string, unknown>>>;
  softDelete(id: number): Promise<Result<void>>;
  findBudgetLines(budgetId: string, limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  createBudgetLine(budgetId: string, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
}
export const FINANCE_BUDGETS_REPO = 'IFinanceBudgetsRepository';
