/**
 * @module test/hr/payroll-record.aggregate.spec
 * @description Unit tests for Salary value object + PayrollRecord aggregate
 * (HR audit 2026-05-16 §2.3 #3, task H.10). Covers the non-negative `net`
 * invariant, the increase/decrease/completeRun state machine, and the
 * domain-event drain semantics that mirror LeaveRequest.
 */

import { Salary } from '../../src/modules/hr/domain/value-objects/salary.vo';
import {
  PayrollRecord,
  PayrollRecordRawProps,
} from '../../src/modules/hr/domain/aggregates/payroll-record.aggregate';
import { Employee, EmployeeProps } from '../../src/modules/hr/domain/aggregates/employee.aggregate';
import { SalaryIncreasedEvent } from '../../src/modules/hr/domain/events/salary-increased.event';
import { SalaryDecreasedEvent } from '../../src/modules/hr/domain/events/salary-decreased.event';
import { PayrollRunCompletedEvent } from '../../src/modules/hr/domain/events/payroll-run-completed.event';
import { employeeFactory } from '../_fixtures/factories';

// ─── Helpers ────────────────────────────────────────────────────────────────
function makeEmployee(overrides: Partial<EmployeeProps> = {}): Employee {
  const f = employeeFactory();
  return Employee.create({
    id: f.id,
    userId: f.userId,
    departmentId: f.departmentId,
    positionId: f.positionId,
    employmentType: 'monthly',
    baseSalary: 5_000_000,
    status: 'active',
    ...overrides,
  });
}

function unwrap<T>(r: { ok: true; data: T } | { ok: false; error: { message: string } }): T {
  if (!r.ok) throw new Error(`Expected Ok but got Err: ${r.error.message}`);
  return r.data;
}

function baseRawProps(over: Partial<PayrollRecordRawProps> = {}): PayrollRecordRawProps {
  const now = new Date('2026-05-17T00:00:00Z');
  return {
    id: 1,
    employeeId: 11,
    periodId: 202_605,
    gross: 5_000_000,
    inps: 300_000,
    jshd: 50_000,
    other: 0,
    currency: 'UZS',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    ...over,
  };
}

// ─── Salary VO ──────────────────────────────────────────────────────────────
describe('Salary.create', () => {
  it('computes net = gross - inps - jshd - other', () => {
    const s = unwrap(Salary.create(5_000_000, 300_000, 50_000, 100_000));
    expect(s.gross).toBe(5_000_000);
    expect(s.inps).toBe(300_000);
    expect(s.jshd).toBe(50_000);
    expect(s.net).toBe(5_000_000 - 300_000 - 50_000 - 100_000);
  });

  it('clamps net to zero when deductions exceed gross', () => {
    const s = unwrap(Salary.create(100, 200, 50, 0));
    expect(s.net).toBe(0);
  });

  it('rejects a negative gross', () => {
    const r = Salary.create(-1, 0, 0, 0);
    expect(r.ok).toBe(false);
  });

  it('rejects a non-finite input', () => {
    const r = Salary.create(Number.NaN, 0, 0, 0);
    expect(r.ok).toBe(false);
  });

  it('normalizes the currency code to upper case', () => {
    const s = unwrap(Salary.create(1, 0, 0, 0, 'usd'));
    expect(s.currency).toBe('USD');
  });

  it('rejects a currency code that is not 3 characters', () => {
    const r = Salary.create(1, 0, 0, 0, 'USDZ');
    expect(r.ok).toBe(false);
  });

  it('totalTax returns inps + jshd', () => {
    const s = unwrap(Salary.create(5_000_000, 300_000, 50_000));
    expect(s.totalTax()).toBe(350_000);
  });
});

// ─── PayrollRecord — factories ──────────────────────────────────────────────
describe('PayrollRecord.createFromEmployee', () => {
  it('derives salary from the Employee aggregate payroll arithmetic', () => {
    const emp = makeEmployee({ baseSalary: 1_760_000 });
    const rec = unwrap(PayrollRecord.createFromEmployee(emp, {
      id: 7,
      periodId: 202_605,
      overtimeHours: 0,
      bonus: 0,
    }));
    expect(rec.employeeId).toBe(emp.id);
    expect(rec.periodId).toBe(202_605);
    expect(rec.salary.gross).toBe(1_760_000);
    expect(rec.status).toBe('draft');
  });

  it('starts in draft status with no domain events buffered', () => {
    const emp = makeEmployee();
    const rec = unwrap(PayrollRecord.createFromEmployee(emp, { id: 1, periodId: 1 }));
    expect(rec.status).toBe('draft');
    expect(rec.getDomainEvents()).toHaveLength(0);
  });
});

describe('PayrollRecord.fromProps', () => {
  it('hydrates with the same Salary as create()', () => {
    const rec = unwrap(PayrollRecord.fromProps(baseRawProps()));
    expect(rec.id).toBe(1);
    expect(rec.salary.gross).toBe(5_000_000);
    expect(rec.salary.net).toBe(5_000_000 - 300_000 - 50_000);
  });

  it('propagates Salary validation failures', () => {
    const r = PayrollRecord.fromProps(baseRawProps({ inps: -1 }));
    expect(r.ok).toBe(false);
  });
});

// ─── State transitions ─────────────────────────────────────────────────────
describe('PayrollRecord.increaseSalary', () => {
  it('emits SalaryIncreasedEvent with the correct delta on success', () => {
    const rec = unwrap(PayrollRecord.fromProps(baseRawProps({ status: 'draft' })));
    const r = rec.increaseSalary(6_000_000, 360_000, 60_000, 'manager-9');
    expect(r.ok).toBe(true);
    expect(rec.salary.gross).toBe(6_000_000);
    const events = rec.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(SalaryIncreasedEvent);
    const ev = events[0] as SalaryIncreasedEvent;
    expect(ev.props.oldGross).toBe(5_000_000);
    expect(ev.props.newGross).toBe(6_000_000);
    expect(ev.props.delta).toBe(1_000_000);
    expect(ev.props.changedBy).toBe('manager-9');
  });

  it('rejects when newGross is less than or equal to current gross', () => {
    const rec = unwrap(PayrollRecord.fromProps(baseRawProps()));
    expect(rec.increaseSalary(5_000_000, 0, 0, 'u-1').ok).toBe(false);
    expect(rec.increaseSalary(4_000_000, 0, 0, 'u-1').ok).toBe(false);
    expect(rec.getDomainEvents()).toHaveLength(0);
  });

  it('rejects when the record is already posted', () => {
    const rec = unwrap(PayrollRecord.fromProps(baseRawProps({ status: 'posted' })));
    const r = rec.increaseSalary(6_000_000, 360_000, 60_000, 'u-1');
    expect(r.ok).toBe(false);
  });
});

describe('PayrollRecord.decreaseSalary', () => {
  it('emits SalaryDecreasedEvent with a negative delta', () => {
    const rec = unwrap(PayrollRecord.fromProps(baseRawProps()));
    const r = rec.decreaseSalary(4_000_000, 240_000, 40_000, 'manager-9');
    expect(r.ok).toBe(true);
    const events = rec.getDomainEvents();
    expect(events[0]).toBeInstanceOf(SalaryDecreasedEvent);
    expect((events[0] as SalaryDecreasedEvent).props.delta).toBe(-1_000_000);
  });

  it('rejects when newGross is greater than or equal to current gross', () => {
    const rec = unwrap(PayrollRecord.fromProps(baseRawProps()));
    expect(rec.decreaseSalary(5_000_000, 0, 0, 'u-1').ok).toBe(false);
    expect(rec.decreaseSalary(6_000_000, 0, 0, 'u-1').ok).toBe(false);
  });
});

describe('PayrollRecord.completeRun', () => {
  it('transitions draft → posted and emits PayrollRunCompletedEvent', () => {
    const rec = unwrap(PayrollRecord.fromProps(baseRawProps({ status: 'draft' })));
    const r = rec.completeRun();
    expect(r.ok).toBe(true);
    expect(rec.status).toBe('posted');
    const events = rec.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(PayrollRunCompletedEvent);
    expect((events[0] as PayrollRunCompletedEvent).props.netAmount).toBe(rec.salary.net);
  });

  it('is idempotent on a posted record (no new event)', () => {
    const rec = unwrap(PayrollRecord.fromProps(baseRawProps({ status: 'posted' })));
    const r = rec.completeRun();
    expect(r.ok).toBe(true);
    expect(rec.getDomainEvents()).toHaveLength(0);
  });
});

describe('PayrollRecord event drain', () => {
  it('clearDomainEvents empties the buffer', () => {
    const rec = unwrap(PayrollRecord.fromProps(baseRawProps()));
    rec.completeRun();
    expect(rec.getDomainEvents()).toHaveLength(1);
    rec.clearDomainEvents();
    expect(rec.getDomainEvents()).toHaveLength(0);
  });
});
