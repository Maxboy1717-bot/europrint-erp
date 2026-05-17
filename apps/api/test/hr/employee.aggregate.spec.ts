/**
 * @module test/hr/employee.aggregate.spec
 * @description Unit tests for the Employee aggregate — focuses on payroll
 * arithmetic (gross, INPS, JSHD, net) and SalaryCalculated event emission.
 */

import { Employee, EmployeeProps } from '../../src/modules/hr/domain/aggregates/employee.aggregate';
import { SalaryCalculatedEvent } from '../../src/modules/hr/domain/events/salary-calculated.event';
import { employeeFactory } from '../_fixtures/factories';

function makeEmployee(overrides: Partial<EmployeeProps> = {}): Employee {
  const f = employeeFactory();
  const base: EmployeeProps = {
    id: f.id,
    userId: f.userId,
    departmentId: f.departmentId,
    positionId: f.positionId,
    employmentType: 'monthly',
    baseSalary: 5_000_000,
    status: 'active',
  };
  return Employee.create({ ...base, ...overrides });
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

describe('Employee.calculateInps', () => {
  it('returns INPS contribution rounded to two decimals when rate is applied', () => {
    const e = makeEmployee();
    expect(e.calculateInps(1_000_000, 0.001)).toBe(1000);
  });

  it('returns zero INPS when rate is zero', () => {
    const e = makeEmployee();
    expect(e.calculateInps(1_000_000, 0)).toBe(0);
  });

  it('rounds INPS to two decimals when product has fractional remainder', () => {
    const e = makeEmployee();
    // 12345.6789 * 0.01 = 123.456789 → 123.46
    expect(e.calculateInps(12345.6789, 0.01)).toBe(123.46);
  });
});

describe('Employee.calculateJshd', () => {
  it('returns JSHD contribution rounded to two decimals when rate is applied', () => {
    const e = makeEmployee();
    // 2_000_000 * 0.12 = 240_000
    expect(e.calculateJshd(2_000_000, 0.12)).toBe(240_000);
  });

  it('returns zero JSHD when rate is zero', () => {
    const e = makeEmployee();
    expect(e.calculateJshd(2_000_000, 0)).toBe(0);
  });
});

describe('Employee.calculateNetSalary', () => {
  it('subtracts all deductions from gross when amounts fit within gross', () => {
    const e = makeEmployee();
    expect(e.calculateNetSalary(2_000_000, 50_000, 240_000, 10_000)).toBe(1_700_000);
  });

  it('returns zero when total deductions exceed gross salary', () => {
    const e = makeEmployee();
    expect(e.calculateNetSalary(100_000, 60_000, 50_000, 20_000)).toBe(0);
  });

  it('returns gross when all deductions are zero', () => {
    const e = makeEmployee();
    expect(e.calculateNetSalary(1_500_000, 0, 0, 0)).toBe(1_500_000);
  });
});

describe('Employee.emitSalaryCalculation', () => {
  it('appends a SalaryCalculatedEvent when payroll is recorded', () => {
    const e = makeEmployee({ id: 5, departmentId: 3 });
    e.emitSalaryCalculation(2_000_000, 50_000, 240_000, 1_710_000);
    const events = e.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(SalaryCalculatedEvent);
    const ev = events[0] as SalaryCalculatedEvent;
    expect(ev.props.employeeId).toBe(5);
    expect(ev.props.departmentId).toBe(3);
    expect(ev.props.gross).toBe(2_000_000);
    expect(ev.props.inps).toBe(50_000);
    expect(ev.props.jshd).toBe(240_000);
    expect(ev.props.netSalary).toBe(1_710_000);
  });

  it('accumulates multiple events when emit is called repeatedly', () => {
    const e = makeEmployee();
    e.emitSalaryCalculation(1_000_000, 10, 20, 999_970);
    e.emitSalaryCalculation(2_000_000, 30, 40, 1_999_930);
    expect(e.getDomainEvents()).toHaveLength(2);
  });
});

describe('Employee.clearDomainEvents', () => {
  it('removes all events when clearDomainEvents is invoked', () => {
    const e = makeEmployee();
    e.emitSalaryCalculation(1_000_000, 10, 20, 999_970);
    expect(e.getDomainEvents()).toHaveLength(1);
    e.clearDomainEvents();
    expect(e.getDomainEvents()).toHaveLength(0);
  });
});

// -- DDD C.22: Result-returning tax / salary calculations -----------------

describe('Employee C.22 — Result-returning tax / salary methods', () => {
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

  it('calculateInpsVO returns Err on negative gross', () => {
    const e = makeEmployee();
    const r = e.calculateInpsVO(-100, 0.01);
    expect(r.ok).toBe(false);
  });

  it('calculateInpsVO returns Money on valid input', () => {
    const e = makeEmployee();
    const r = e.calculateInpsVO(1_000_000, 0.01);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.amount).toBe(10_000);
  });

  it('calculateJshdVO returns Err on Infinity rate', () => {
    const e = makeEmployee();
    const r = e.calculateJshdVO(1_000_000, Infinity);
    expect(r.ok).toBe(false);
  });

  it('calculateNetSalaryVO clamps to zero when deductions > gross', () => {
    const e = makeEmployee();
    const r = e.calculateNetSalaryVO(100, 60, 50, 20);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.amount).toBe(0);
  });
});
