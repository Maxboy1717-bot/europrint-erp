/**
 * @module hr.dto.spec
 * @description Jest / Vitest test suite.
 */


import {
  HrCheckInSchema,
  HrCheckOutSchema,
  HrUpdateEmployeeStatusSchema,
  HrReviewSalarySchema,
  HrUpdateProfileImageSchema,
  HrAssignOrgFunctionsSchema,
  HrImportEmployeesSchema,
  HrCalculatePayrollSchema,
  HrCreateScheduleSchema,
  HrCreateSwapRequestSchema,
} from './hr.dto';

describe('HrCheckInSchema', () => {
  it('accepts valid check-in with employeeId', () => {
    const result = HrCheckInSchema.safeParse({ employeeId: 42 });
    expect(result.success).toBe(true);
  });

  it('accepts optional fields', () => {
    const result = HrCheckInSchema.safeParse({
      employeeId: 1,
      attendanceDate: '2026-01-15',
      checkInTime: '09:00:00',
      source: 'fingerprint',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing employeeId', () => {
    const result = HrCheckInSchema.safeParse({ attendanceDate: '2026-01-15' });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive employeeId', () => {
    const result = HrCheckInSchema.safeParse({ employeeId: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer employeeId', () => {
    const result = HrCheckInSchema.safeParse({ employeeId: 'not-a-number' });
    expect(result.success).toBe(false);
  });
});

describe('HrCheckOutSchema', () => {
  it('accepts valid check-out with employeeId', () => {
    const result = HrCheckOutSchema.safeParse({ employeeId: 42 });
    expect(result.success).toBe(true);
  });

  it('accepts overtimeMinutes', () => {
    const result = HrCheckOutSchema.safeParse({ employeeId: 1, overtimeMinutes: 30 });
    expect(result.success).toBe(true);
  });

  it('rejects negative overtimeMinutes', () => {
    const result = HrCheckOutSchema.safeParse({ employeeId: 1, overtimeMinutes: -5 });
    expect(result.success).toBe(false);
  });

  it('rejects missing employeeId', () => {
    const result = HrCheckOutSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('HrUpdateEmployeeStatusSchema', () => {
  it('accepts valid active status', () => {
    const result = HrUpdateEmployeeStatusSchema.safeParse({ status: 'active' });
    expect(result.success).toBe(true);
  });

  it('accepts all valid status values', () => {
    for (const s of ['active', 'on_leave', 'terminated', 'inactive'] as const) {
      expect(HrUpdateEmployeeStatusSchema.safeParse({ status: s }).success).toBe(true);
    }
  });

  it('rejects unknown status', () => {
    const result = HrUpdateEmployeeStatusSchema.safeParse({ status: 'fired' });
    expect(result.success).toBe(false);
  });

  it('rejects missing status', () => {
    const result = HrUpdateEmployeeStatusSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('HrReviewSalarySchema', () => {
  it('accepts valid proposedIncrease', () => {
    const result = HrReviewSalarySchema.safeParse({ proposedIncrease: 500 });
    expect(result.success).toBe(true);
  });

  it('accepts optional reason', () => {
    const result = HrReviewSalarySchema.safeParse({ proposedIncrease: 500, reason: 'Performance bonus' });
    expect(result.success).toBe(true);
  });

  it('rejects zero proposedIncrease', () => {
    const result = HrReviewSalarySchema.safeParse({ proposedIncrease: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects missing proposedIncrease', () => {
    const result = HrReviewSalarySchema.safeParse({ reason: 'no amount' });
    expect(result.success).toBe(false);
  });
});

describe('HrUpdateProfileImageSchema', () => {
  it('accepts valid imageUrl', () => {
    const result = HrUpdateProfileImageSchema.safeParse({ imageUrl: 'https://cdn.example.com/img.jpg' });
    expect(result.success).toBe(true);
  });

  it('rejects empty imageUrl', () => {
    const result = HrUpdateProfileImageSchema.safeParse({ imageUrl: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing imageUrl', () => {
    const result = HrUpdateProfileImageSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('HrAssignOrgFunctionsSchema', () => {
  it('accepts all optional fields', () => {
    const result = HrAssignOrgFunctionsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts departmentId and positionId', () => {
    const result = HrAssignOrgFunctionsSchema.safeParse({ departmentId: 'dept-1', positionId: 'pos-2' });
    expect(result.success).toBe(true);
  });
});

describe('HrImportEmployeesSchema', () => {
  it('accepts empty employees array', () => {
    const result = HrImportEmployeesSchema.safeParse({ employees: [] });
    expect(result.success).toBe(true);
  });

  it('accepts array of employee objects', () => {
    const result = HrImportEmployeesSchema.safeParse({
      employees: [{ name: 'John', department: 'HR' }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts missing employees (optional)', () => {
    const result = HrImportEmployeesSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects a batch larger than 1000 rows (C9.1 DoS cap)', () => {
    const employees = Array.from({ length: 1001 }, () => ({ name: 'X' }));
    const result = HrImportEmployeesSchema.safeParse({ employees });
    expect(result.success).toBe(false);
  });

  it('accepts a batch of exactly 1000 rows', () => {
    const employees = Array.from({ length: 1000 }, () => ({ name: 'X' }));
    const result = HrImportEmployeesSchema.safeParse({ employees });
    expect(result.success).toBe(true);
  });
});

describe('HrCalculatePayrollSchema', () => {
  it('accepts valid payroll data', () => {
    const result = HrCalculatePayrollSchema.safeParse({ employeeId: 1, baseSalary: 5000000 });
    expect(result.success).toBe(true);
  });

  it('accepts all optional fields', () => {
    const result = HrCalculatePayrollSchema.safeParse({
      employeeId: 1,
      baseSalary: 5000000,
      period: '2026-01',
      overtimeHours: 8,
      overtimeRate: 1.5,
      bonus: 500000,
      otherDeductions: 100000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing employeeId', () => {
    const result = HrCalculatePayrollSchema.safeParse({ baseSalary: 5000000 });
    expect(result.success).toBe(false);
  });

  it('rejects missing baseSalary', () => {
    const result = HrCalculatePayrollSchema.safeParse({ employeeId: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive baseSalary', () => {
    const result = HrCalculatePayrollSchema.safeParse({ employeeId: 1, baseSalary: 0 });
    expect(result.success).toBe(false);
  });
});

describe('HrCreateScheduleSchema', () => {
  it('accepts valid shift_date', () => {
    const result = HrCreateScheduleSchema.safeParse({ shift_date: '2026-01-15' });
    expect(result.success).toBe(true);
  });

  it('accepts full schedule with all fields', () => {
    const result = HrCreateScheduleSchema.safeParse({
      shift_date: '2026-01-15',
      shift_type: 'MORNING',
      start_time: '08:00',
      end_time: '17:00',
      employee_id: 42,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty shift_date', () => {
    const result = HrCreateScheduleSchema.safeParse({ shift_date: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing shift_date', () => {
    const result = HrCreateScheduleSchema.safeParse({ shift_type: 'MORNING' });
    expect(result.success).toBe(false);
  });
});

describe('HrCreateSwapRequestSchema', () => {
  it('accepts valid swap request with reason', () => {
    const result = HrCreateSwapRequestSchema.safeParse({
      from_employee_id: 1,
      to_employee_id: 2,
      reason: 'Family emergency',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing reason', () => {
    const result = HrCreateSwapRequestSchema.safeParse({
      from_employee_id: 1,
      to_employee_id: 2,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty reason', () => {
    const result = HrCreateSwapRequestSchema.safeParse({
      from_employee_id: 1,
      reason: '',
    });
    expect(result.success).toBe(false);
  });
});
