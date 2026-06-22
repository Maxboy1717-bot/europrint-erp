/**
 * @module i-fi.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
type Row = Record<string, unknown>;

export interface IFiRepository {
  findAccountingPeriods(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  createAccountingPeriod(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  closeAccountingPeriod(id: number): Promise<Result<Record<string, unknown>>>;
  postGlDocument(id: number): Promise<Result<Record<string, unknown>>>;
  findPayments(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  createPayment(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  getCostCenters(): Promise<Result<Row[]>>;
  createCostCenter(dto: Record<string, unknown>): Promise<Result<Row>>;
  updateCostCenter(id: number, dto: Record<string, unknown>): Promise<Result<Row>>;
  deleteCostCenter(id: number): Promise<Result<void>>;
  getStats(): Promise<Result<{ revenue: number; expenses: number; unpaidInvoices: number; unpaidAmount: number }>>;
  getRecentTransactions(limit: number): Promise<Result<Row[]>>;
  findGlDocuments(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findProfitCenters(): Promise<Result<Row[]>>;
  createProfitCenter(dto: Record<string, unknown>): Promise<Result<Row>>;
  updateProfitCenter(id: number, dto: Record<string, unknown>): Promise<Result<Row>>;
  deleteProfitCenter(id: number): Promise<Result<void>>;
  getTaxSummary(): Promise<Result<{ totalThisMonth: number; paid: number; pending: number; overdue: number }>>;
}

export const FI_REPO = 'IFiRepository';
