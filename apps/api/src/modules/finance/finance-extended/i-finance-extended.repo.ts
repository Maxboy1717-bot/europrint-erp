/**
 * @module i-finance-extended.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IFinanceExtendedRepository {
  findCategories(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findCategoryById(id: number): Promise<Result<object | null>>;
  createCategory(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  updateCategory(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  deleteCategory(id: number): Promise<Result<void>>;
  findIncomeExpense(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findIncomeExpenseSummary(): Promise<Result<Record<string, unknown>>>;
  createIncomeExpense(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  updateIncomeExpense(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  deleteIncomeExpense(id: number): Promise<Result<void>>;
  findInventoryCounts(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findAssetInventory(limit: number, offset: number, status?: string): Promise<Result<{ data: Row[]; count: number }>>;
  findAssetInventoryById(id: string): Promise<Result<object | null>>;
  findDailyMetrics(limit: number, offset: number, date?: string): Promise<Result<{ data: Row[]; count: number }>>;
  findOvertime(limit: number, offset: number, period?: string): Promise<Result<{ data: Row[]; count: number }>>;
  findCustoms(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findInsurance(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
}

export const FINANCE_EXTENDED_REPO = 'IFinanceExtendedRepository';
