/**
 * @module i-hr.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/types/result.type';

export type HrRow = Record<string, unknown>;

export interface IHrRepo {
  findEmployeeById(id: string): Promise<Result<HrRow | null>>;
  findAllEmployees(filters: { department?: string; status?: string; search?: string; page?: number; limit?: number }): Promise<Result<{ items: HrRow[]; total: number }>>;
  saveEmployee(employee: HrRow): Promise<Result<HrRow>>;
  updateEmployee(id: string, data: HrRow): Promise<Result<HrRow>>;

  findAttendance(employeeId: string, period: string): Promise<Result<HrRow[]>>;
  saveAttendance(attendance: HrRow): Promise<Result<HrRow>>;
  getAttendanceStats(employeeId: string, period: string): Promise<Result<HrRow>>;

  findPayroll(filters: { employeeId?: string; period?: string; status?: string }): Promise<Result<HrRow[]>>;
  savePayroll(payroll: HrRow): Promise<Result<HrRow>>;
  updatePayroll(id: string, data: HrRow): Promise<Result<HrRow>>;

  getPayrollSummary(period: string): Promise<Result<{ totalGross: number; totalNet: number; totalINPS: number; totalJSHD: number; employeeCount: number }>>;

  // Leave Management
  findLeaveById(id: string): Promise<Result<HrRow | null>>;
  findLeaves(filters: {
    employeeId?: string;
    status?: string;
    leaveType?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: HrRow[]; total: number }>>;
  saveLeave(leave: HrRow): Promise<Result<HrRow>>;
  updateLeave(id: string, data: HrRow): Promise<Result<HrRow>>;
  getLeaveBalance(employeeId: string): Promise<
    Result<{
      annual: { used: number; remaining: number; total: number };
      sick: { used: number };
      maternity: { used: number };
    }>
  >;
  getLeaveStats(): Promise<
    Result<{
      byStatus: Record<string, number>;
      byType: Record<string, number>;
      currentlyOnLeave: number;
    }>
  >;
  save360Feedback(feedback: { employeeId: number; orderId?: number; sessionId?: string; quantity?: number; defectRate?: number; oee?: number; recordedAt?: Date }): Promise<Result<HrRow>>;

  findPayrollRuns(period?: string): Promise<Result<{ data: HrRow[]; total: number }>>;
  findPayrollPeriods(): Promise<Result<{ data: HrRow[]; total: number }>>;
  findVacancyCandidates(vacancyId?: string): Promise<Result<HrRow[]>>;
  findDisciplineRecords(employeeId?: string): Promise<Result<HrRow[]>>;
  findHealthCheckups(departmentId?: string): Promise<Result<HrRow[]>>;

  /**
   * Returns the most recent active overtime_policy row. Used by the overtime
   * calculator domain service. The row carries multipliers + night-shift
   * windows; nulls returned when no active policy exists.
   */
  findActiveOvertimePolicy(): Promise<Result<OvertimePolicyRow | null>>;
}

export interface OvertimePolicyRow {
  regularOvertimeHours: number;
  regularMultiplier: number;
  extendedMultiplier: number;
  weekendMultiplier: number;
  nightShiftBonus: number;
  nightShiftStartHour: number;
  nightShiftEndHour: number;
}

export const HR_REPO = Symbol('HR_REPO');
