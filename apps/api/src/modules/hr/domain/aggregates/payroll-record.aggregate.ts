/**
 * @module payroll-record.aggregate
 * @description PayrollRecord aggregate root — one record per (employee,
 * payroll period). Holds a `Salary` VO and a small state machine
 * (`draft` → `approved` → `posted`). State-transition methods return
 * `Result<void>` and emit typed domain events into the internal buffer.
 *
 * Pattern: follows LeaveRequest/Attendance (private `props` bag, getters,
 * `getDomainEvents()` + `clearDomainEvents()` drain). The factory
 * `createFromEmployee` reuses the existing Employee aggregate's payroll
 * arithmetic (`calculateGrossSalary`/INPS/JSHD) so there's a single source
 * of truth for the math.
 */

import { Logger } from '@nestjs/common';
import { TashkentTimeService } from '@common/time';
import { Result, Ok, Err, AppErr } from '@common/types/result.type';
import { DomainEvent } from '@shared/domain/domain-event';
import { Salary } from '../value-objects/salary.vo';
import { Employee } from './employee.aggregate';
import { SalaryIncreasedEvent } from '../events/salary-increased.event';
import { SalaryDecreasedEvent } from '../events/salary-decreased.event';
import { PayrollRunCompletedEvent } from '../events/payroll-run-completed.event';

const _time = new TashkentTimeService();

export type PayrollRecordStatus = 'draft' | 'approved' | 'posted';

export interface PayrollRecordProps {
  id: number;
  employeeId: number;
  periodId: number;
  salary: Salary;
  status: PayrollRecordStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** Raw shape used by `fromProps` when hydrating from DB rows. */
export interface PayrollRecordRawProps {
  id: number;
  employeeId: number;
  periodId: number;
  gross: number;
  inps: number;
  jshd: number;
  other?: number;
  currency?: string;
  status: PayrollRecordStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class PayrollRecord {
  private readonly logger = new Logger(PayrollRecord.name);
  private events: DomainEvent[] = [];

  private constructor(private props: PayrollRecordProps) {}

  /**
   * Build a brand-new PayrollRecord from an Employee + overtime/bonus inputs.
   * Returns Err if any salary input fails the non-negative finite check.
   */
  static createFromEmployee(
    employee: Employee,
    args: {
      id: number;
      periodId: number;
      overtimeHours?: number;
      bonus?: number;
      other?: number;
      currency?: string;
      createdAt?: Date;
    },
  ): Result<PayrollRecord> {
    const overtimeHours = args.overtimeHours ?? 0;
    const bonus = args.bonus ?? 0;
    const other = args.other ?? 0;
    const currency = args.currency ?? 'UZS';

    const gross = employee.calculateGrossSalary(overtimeHours, bonus);
    const inps = employee.calculateInps(gross);
    const jshd = employee.calculateJshd(gross);

    const salaryR = Salary.create(gross, inps, jshd, other, currency);
    if (!salaryR.ok) return Err(salaryR.error);

    const now = args.createdAt ?? _time.now();
    return Ok(
      new PayrollRecord({
        id: args.id,
        employeeId: employee.id,
        periodId: args.periodId,
        salary: salaryR.data,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      }),
    );
  }

  /** Hydrate from a persisted row. Returns Err if Salary invariants fail. */
  static fromProps(props: PayrollRecordRawProps): Result<PayrollRecord> {
    const salaryR = Salary.create(
      props.gross,
      props.inps,
      props.jshd,
      props.other ?? 0,
      props.currency ?? 'UZS',
    );
    if (!salaryR.ok) return Err(salaryR.error);
    return Ok(
      new PayrollRecord({
        id: props.id,
        employeeId: props.employeeId,
        periodId: props.periodId,
        salary: salaryR.data,
        status: props.status,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      }),
    );
  }

  // ─── Getters ────────────────────────────────────────────────────────────
  get id(): number { return this.props.id; }
  get employeeId(): number { return this.props.employeeId; }
  get periodId(): number { return this.props.periodId; }
  get salary(): Salary { return this.props.salary; }
  get status(): PayrollRecordStatus { return this.props.status; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ─── State transitions ──────────────────────────────────────────────────

  /**
   * Raise the gross salary on this record. `newGross` must be strictly
   * greater than the current gross (use `decreaseSalary` otherwise).
   * Cannot run on a posted record — those are immutable.
   */
  increaseSalary(
    newGross: number,
    newInps: number,
    newJshd: number,
    changedBy: string,
    newOther: number = 0,
  ): Result<void> {
    if (this.props.status === 'posted') {
      return Err(AppErr('INVALID_TRANSITION', "Posted payroll record o'zgartirilmaydi"));
    }
    const oldGross = this.props.salary.gross;
    if (newGross <= oldGross) {
      return Err(AppErr(
        'BUSINESS_RULE_VIOLATION',
        `Yangi gross (${newGross}) eski grossdan (${oldGross}) katta bo'lishi kerak — kamaytirish uchun decreaseSalary ishlatiladi`,
      ));
    }
    const salaryR = Salary.create(newGross, newInps, newJshd, newOther, this.props.salary.currency);
    if (!salaryR.ok) return Err(salaryR.error);

    const now = _time.now();
    this.props.salary = salaryR.data;
    this.props.updatedAt = now;
    this.events.push(new SalaryIncreasedEvent({
      payrollRecordId: this.props.id,
      employeeId: this.props.employeeId,
      periodId: this.props.periodId,
      oldGross,
      newGross,
      delta: newGross - oldGross,
      changedBy,
      changedAt: now,
    }));
    return Ok();
  }

  /**
   * Lower the gross salary. `newGross` must be strictly less than the
   * current gross.
   */
  decreaseSalary(
    newGross: number,
    newInps: number,
    newJshd: number,
    changedBy: string,
    newOther: number = 0,
  ): Result<void> {
    if (this.props.status === 'posted') {
      return Err(AppErr('INVALID_TRANSITION', "Posted payroll record o'zgartirilmaydi"));
    }
    const oldGross = this.props.salary.gross;
    if (newGross >= oldGross) {
      return Err(AppErr(
        'BUSINESS_RULE_VIOLATION',
        `Yangi gross (${newGross}) eski grossdan (${oldGross}) kichik bo'lishi kerak — oshirish uchun increaseSalary ishlatiladi`,
      ));
    }
    const salaryR = Salary.create(newGross, newInps, newJshd, newOther, this.props.salary.currency);
    if (!salaryR.ok) return Err(salaryR.error);

    const now = _time.now();
    this.props.salary = salaryR.data;
    this.props.updatedAt = now;
    this.events.push(new SalaryDecreasedEvent({
      payrollRecordId: this.props.id,
      employeeId: this.props.employeeId,
      periodId: this.props.periodId,
      oldGross,
      newGross,
      delta: newGross - oldGross,
      changedBy,
      changedAt: now,
    }));
    return Ok();
  }

  /**
   * Mark this record as posted (period close path). Idempotent on `posted`
   * (returns Ok without re-emitting). Transitions from `draft` or
   * `approved`; rejects any other state.
   */
  completeRun(): Result<void> {
    if (this.props.status === 'posted') {
      return Ok();
    }
    if (this.props.status !== 'draft' && this.props.status !== 'approved') {
      return Err(AppErr('INVALID_TRANSITION', `Payroll record holati noto'g'ri: ${this.props.status}`));
    }
    const now = _time.now();
    this.props.status = 'posted';
    this.props.updatedAt = now;
    this.events.push(new PayrollRunCompletedEvent({
      payrollRecordId: this.props.id,
      employeeId: this.props.employeeId,
      periodId: this.props.periodId,
      netAmount: this.props.salary.net,
      completedAt: now,
    }));
    return Ok();
  }

  // ─── Event buffer ───────────────────────────────────────────────────────
  getDomainEvents(): DomainEvent[] {
    return this.events;
  }

  clearDomainEvents(): void {
    this.events = [];
  }
}
