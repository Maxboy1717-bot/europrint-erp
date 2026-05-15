/**
 * @module use-hr.test
 * @description Vitest tests for the use-hr re-export aggregator.
 */

import { describe, it, expect } from 'vitest';
import * as useHr from './use-hr';

describe('use-hr re-exports', () => {
  it('re-exports HR employees hooks', () => {
    expect(typeof useHr.useEmployees).toBe('function');
    expect(typeof useHr.useEmployee).toBe('function');
    expect(typeof useHr.useCreateEmployee).toBe('function');
    expect(typeof useHr.useDeleteEmployee).toBe('function');
  });

  it('re-exports HR departments hooks', () => {
    expect(typeof useHr.useDepartments).toBe('function');
    expect(typeof useHr.useCreateDepartment).toBe('function');
    expect(typeof useHr.useDeleteDepartment).toBe('function');
  });

  it('re-exports HR attendance hooks', () => {
    expect(typeof useHr.useAttendance).toBe('function');
    expect(typeof useHr.useCheckIn).toBe('function');
    expect(typeof useHr.useCheckOut).toBe('function');
  });

  it('re-exports HR payroll hooks', () => {
    expect(typeof useHr.usePayrollPeriods).toBe('function');
    expect(typeof useHr.useCalculatePayroll).toBe('function');
    expect(typeof useHr.useApprovePayroll).toBe('function');
  });

  it('re-exports HR leave hooks', () => {
    expect(typeof useHr.useLeaveTypes).toBe('function');
    expect(typeof useHr.useLeaveRequests).toBe('function');
    expect(typeof useHr.useApproveLeave).toBe('function');
  });

  it('re-exports HR KPI hooks', () => {
    expect(typeof useHr.useDailyKpi).toBe('function');
    expect(typeof useHr.useGoals).toBe('function');
    expect(typeof useHr.useProductivity).toBe('function');
  });

  it('re-exports HR discipline hooks', () => {
    expect(typeof useHr.useDisciplineRecords).toBe('function');
    expect(typeof useHr.useDisciplineAppeals).toBe('function');
  });
});
