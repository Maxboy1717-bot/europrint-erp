/**
 * @module test/hr/employee.aggregate.spec
 * @description Unit tests for the Employee aggregate — GROSS salary arithmetic
 * only. The ERP does NOT compute tax (JSHD/INPS/pension) — that lives in 1C —
 * so the aggregate's tax methods and SalaryCalculated event were removed.
 */

import { Employee, EmployeeProps } from '../../src/modules/hr/domain/aggregates/employee.aggregate';
import { EmployeeId } from '../../src/modules/shared/domain/value-objects/employee-id.vo';
import { employeeFactory } from '../_fixtures/factories';

function makeEmployee(overrides: Partial<EmployeeProps & { id: number }> = {}): Employee {
  const f = employeeFactory();
  // EmployeeProps.id requires an EmployeeId VO — use fromRaw() for trusted values
  const rawId = (overrides.id as number | EmployeeId | undefined);
  const employeeId = rawId instanceof EmployeeId
    ? rawId
    : EmployeeId.fromRaw(typeof rawId === 'number' ? rawId : f.id);
  const base: EmployeeProps = {
    id: employeeId,
    userId: overrides.userId ?? f.userId,
    departmentId: overrides.departmentId ?? f.departmentId,
    positionId: overrides.positionId ?? f.positionId,
    employmentType: (overrides as EmployeeProps).employmentType ?? 'monthly',
    baseSalary: overrides.baseSalary ?? 5_000_000,
    status: overrides.status ?? 'active',
  };
  return Employee.create(base);
}

describe('Employee.create', () => {
  it('exposes identity getters when constructed', () => {
    const e = makeEmployee({ id: 11, userId: 22, departmentId: 3, positionId: 9, baseSalary: 4_000_000 });
    expect(e.id).toBe(11);
    expect(e.userId).toBe(22);
    expect(e.departmentId).toBe(3);
    expect(e.positionId).toBe(9);
    expect(e.baseSalary).toBe(4_000_000);
    expect(e.status).toBe('active');
  });

  it('reflects on_leave status when passed in props', () => {
    const e = makeEmployee({ status: 'on_leave' });
    expect(e.status).toBe('on_leave');
  });
});

describe('Employee.calculateGrossSalary', () => {
  it('returns base salary when there is no overtime or bonus', () => {
    const e = makeEmployee({ baseSalary: 1_760_000 });
    expect(e.calculateGrossSalary(0, 0)).toBe(1_760_000);
  });

  it('adds 1.5x hourly overtime to base salary when overtime is provided', () => {
    const e = makeEmployee({ baseSalary: 1_760_000 });
    // hourly = 1_760_000 / 176 = 10_000; ot = 10 * 10_000 * 1.5 = 150_000
    expect(e.calculateGrossSalary(10, 0)).toBe(1_910_000);
  });

  it('includes bonus and overtime in the gross when both are passed', () => {
    const e = makeEmployee({ baseSalary: 1_760_000 });
    // bonus = 200_000; ot = 4 * 10_000 * 1.5 = 60_000 → gross = 2_020_000
    expect(e.calculateGrossSalary(4, 200_000)).toBe(2_020_000);
  });

  it('treats negative overtime as subtraction from gross when caller passes it', () => {
    const e = makeEmployee({ baseSalary: 1_760_000 });
    // -2 * 10_000 * 1.5 = -30_000 → gross = 1_730_000
    expect(e.calculateGrossSalary(-2, 0)).toBe(1_730_000);
  });
});

// -- DDD C.22: Result-returning gross-salary calculation ---------------------

describe('Employee C.22 — Result-returning gross-salary method', () => {
  it('calculateGrossSalaryVO returns Money on valid input', () => {
    const e = makeEmployee({ baseSalary: 1_760_000 });
    const r = e.calculateGrossSalaryVO(10, 0);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.amount).toBe(1_910_000);
    expect(r.data.currency).toBe('UZS');
  });

  it('calculateGrossSalaryVO returns Err on negative overtime', () => {
    const e = makeEmployee({ baseSalary: 1_760_000 });
    const r = e.calculateGrossSalaryVO(-1, 0);
    expect(r.ok).toBe(false);
  });

  it('calculateGrossSalaryVO returns Err on NaN bonus', () => {
    const e = makeEmployee();
    const r = e.calculateGrossSalaryVO(0, NaN);
    expect(r.ok).toBe(false);
  });
});
