/**
 * @module i-hr-leave-svc.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
type Row = Record<string, unknown>;

export interface IHrLeaveSvcRepository {
  findAll(opts: { limit: number; offset: number; userId?: number; status?: string; leaveType?: string }): Promise<Result<{ data: Row[]; count: number }>>;
  findById(id: number): Promise<Result<any | null>>;
  findUserById(userId: number): Promise<Result<any | null>>;
  create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  approve(id: number): Promise<Result<Record<string, unknown>>>;
  reject(id: number): Promise<Result<Record<string, unknown>>>;

  // ─── Leave balance accrual (T7.5) ──────────────────────────────────────
  listActiveEmployeesWithHireDate(): Promise<Result<Array<{ id: number; hireDate: string | null }>>>;
  findBalance(employeeId: number, leaveType: string, year: number): Promise<Result<Row | null>>;
  upsertBalance(input: { employeeId: number; leaveType: string; year: number; total_days: number; used_days: number; remaining_days: number }): Promise<Result<Row>>;
}

export const HR_LEAVE_SVC_REPO = 'IHrLeaveSvcRepository';
