/**
 * @module i-employees.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
type Row = Record<string, unknown>;

export interface IEmployeesRepository {
  findAll(opts: { limit: number; offset: number; search?: string; departmentId?: number; status?: string }): Promise<Result<{ data: Row[]; count: number }>>;
  findById(id: number): Promise<Result<any | null>>;
  findByDepartment(departmentId: number, limit: number, offset: number, search?: string, status?: string): Promise<Result<{ data: Row[]; count: number }>>;
  findSelf(userId: number, limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  softDelete(id: number): Promise<Result<void>>;
}

export const EMPLOYEES_REPO = 'IEmployeesRepository';
