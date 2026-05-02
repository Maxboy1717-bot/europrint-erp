import { Result } from '@common/result';
type Row = Record<string, unknown>;

export interface ICashflowRepository {
  findTransactions(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  createTransaction(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  findDailySummary(date?: string): Promise<Result<Record<string, unknown>>>;
  findForecast(days?: number): Promise<Result<object[]>>;
}

export const CASHFLOW_REPO = 'ICashflowRepository';
