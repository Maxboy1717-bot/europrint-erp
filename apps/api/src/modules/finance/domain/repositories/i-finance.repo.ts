import { Result } from '@common/types/result.type';

export type FinanceRow = Record<string, unknown>;

export interface IFinanceRepo {
  // Invoices
  findInvoiceById(id: string): Promise<Result<FinanceRow | null>>;
  findInvoices(filters: { status?: string; customerId?: string; from?: Date; to?: Date; page?: number; limit?: number }): Promise<Result<{ items: FinanceRow[]; total: number }>>;
  findInvoiceBySalesOrderId(salesOrderId: string): Promise<Result<FinanceRow | null>>;
  saveInvoice(invoice: FinanceRow): Promise<Result<FinanceRow>>;
  updateInvoice(id: string, data: FinanceRow): Promise<Result<FinanceRow>>;

  // Payments
  findPayments(filters: { invoiceId?: string; from?: Date; to?: Date; page?: number; limit?: number }): Promise<Result<{ items: FinanceRow[]; total: number }>>;
  savePayment(payment: FinanceRow): Promise<Result<FinanceRow>>;

  // GL
  saveGlEntry(entry: FinanceRow): Promise<Result<FinanceRow>>;
  findGlEntries(filters: { account?: string; from?: Date; to?: Date; page?: number; limit?: number }): Promise<Result<{ items: FinanceRow[]; total: number }>>;

  // Business queries
  getArAging(): Promise<Result<FinanceRow[]>>;
  getCashFlow(from: Date, to: Date): Promise<Result<{ inflows: number; outflows: number; netFlow: number; from: Date; to: Date }>>;
  getAdvanceSummary(): Promise<Result<FinanceRow[]>>;

  // Budgets
  findBudgetById(id: string): Promise<Result<FinanceRow>>;
  findBudgets(filters: {
    fiscalYear?: number;
    status?: string;
    department?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: FinanceRow[]; total: number }>>;
  saveBudget(budget: FinanceRow, lines: FinanceRow[]): Promise<Result<FinanceRow>>;
  updateBudgetStatus(id: string, status: string): Promise<Result<FinanceRow>>;
  updateActuals(budgetId: string): Promise<Result<FinanceRow>>;
  getBudgetStats(fiscalYear: number): Promise<
    Result<{
      totalBudgets: number;
      approved: number;
      draft: number;
      totalPlanned: number;
      totalActual: number;
      overallVariancePercent: number;
    }>
  >;
}
export const FINANCE_REPO = Symbol('FINANCE_REPO');
