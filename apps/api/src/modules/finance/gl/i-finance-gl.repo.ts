/**
 * @module i-finance-gl.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
type Row = Record<string, unknown>;
export interface IFinanceGlRepository {
  findAllDocuments(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findAllAccounts(): Promise<Result<object[]>>;
  findAccountById(id: number): Promise<Result<object | null>>;
  postDocument(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  seedAccounts(rows: Record<string, unknown>[]): Promise<Result<object[]>>;
  getTrialBalance(date?: string): Promise<Result<{ debit: number; credit: number; balanced: boolean; date: string }>>;
  getLedger(accountCode: string, limit?: number, offset?: number): Promise<Result<Row[]>>;
}
export const FINANCE_GL_REPO = 'IFinanceGlRepository';
