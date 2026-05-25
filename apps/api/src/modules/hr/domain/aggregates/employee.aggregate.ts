/**
 * @module employee.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Logger } from '@nestjs/common';
import { DomainEvent } from '@shared/domain/domain-event';
import { SalaryCalculatedEvent } from '../events/salary-calculated.event';
import { EmployeeId } from '@shared/domain/value-objects/employee-id.vo';
import { Email } from '@shared/domain/value-objects/email.vo';
import { PhoneNumber } from '@shared/domain/value-objects/phone-number.vo';
import { Result, Ok, Err, AppErr } from '@common/types/result.type';
import { Money } from '@shared/domain/value-objects/money.vo';
import {
  PAYROLL_INPS_RATE_DEFAULT,
  PAYROLL_JSHD_RATE_DEFAULT,
  PAYROLL_MONTHLY_HOURS,
  PAYROLL_OVERTIME_MULTIPLIER,
} from '@common/constants/business.constants';

/**
 * VO-typed props for Employee.create. Boundary code is responsible for
 * building the VOs upstream via their `.create(...)` factories.
 */
export interface EmployeeProps {
  id: EmployeeId;
  userId: number;
  departmentId: number;
  positionId: number;
  employmentType: 'monthly' | 'piecework';
  baseSalary: number;
  status: 'active' | 'on_leave' | 'terminated';
  email?: Email;
  phone?: PhoneNumber;
}

/**
 * Back-compat shape — primitive id + raw email/phone strings. Consumed by
 * `Employee.fromRaw`, which runs each VO factory and combines failures.
 */
export interface EmployeeRawProps {
  id: number;
  userId: number;
  departmentId: number;
  positionId: number;
  employmentType: 'monthly' | 'piecework';
  baseSalary: number;
  status: 'active' | 'on_leave' | 'terminated';
  email?: string;
  phone?: string;
}

export class Employee {
  private readonly logger = new Logger(Employee.name);
  private events: DomainEvent[] = [];

  constructor(private props: EmployeeProps) {}

  /**
   * VO-first factory — see `EmployeeProps`. Cannot fail because validation
   * is already done in the VO factories upstream.
   */
  static create(props: EmployeeProps): Employee {
    return new Employee(props);
  }

  /**
   * Back-compat factory that takes raw primitives. Validates `id` (and
   * optionally `email` / `phone`) via the VO factories and combines failures
   * into a single `Err`.
   */
  static fromRaw(props: EmployeeRawProps): Result<Employee> {
    const idR = EmployeeId.create(props.id);
    if (!idR.ok) return Err(idR.error);

    let email: Email | undefined;
    if (props.email !== undefined) {
      const r = Email.create(props.email);
      if (!r.ok) return Err(r.error);
      email = r.data;
    }

    let phone: PhoneNumber | undefined;
    if (props.phone !== undefined) {
      const r = PhoneNumber.create(props.phone);
      if (!r.ok) return Err(r.error);
      phone = r.data;
    }

    return Ok(
      Employee.create({
        id: idR.data,
        userId: props.userId,
        departmentId: props.departmentId,
        positionId: props.positionId,
        employmentType: props.employmentType,
        baseSalary: props.baseSalary,
        status: props.status,
        email,
        phone,
      }),
    );
  }

  get id(): number { return this.props.id.value; }
  get idVO(): EmployeeId { return this.props.id; }
  get userId(): number { return this.props.userId; }
  get departmentId(): number { return this.props.departmentId; }
  get positionId(): number { return this.props.positionId; }
  get baseSalary(): number { return this.props.baseSalary; }
  get status(): string { return this.props.status; }
  get email(): string | undefined { return this.props.email?.value; }
  get emailVO(): Email | undefined { return this.props.email; }
  get phone(): string | undefined { return this.props.phone?.value; }
  get phoneVO(): PhoneNumber | undefined { return this.props.phone; }

  /** Legacy primitive API — kept for back-compat. Prefer `calculateGrossSalaryVO`. */
  calculateGrossSalary(overtimeHours: number, bonus: number): number {
    const base = this.props.baseSalary;
    const overtime = overtimeHours * (base / PAYROLL_MONTHLY_HOURS) * PAYROLL_OVERTIME_MULTIPLIER;
    const gross = base + overtime + bonus;
    this.logger.debug(
      `Gross calculation - Base: ${base}, OT: ${overtime}, Bonus: ${bonus}, Total: ${gross}`
    );
    return gross;
  }

  /**
   * Result-returning gross salary that returns a `Money` VO. Validates that
   * `overtimeHours` and `bonus` are non-negative finite numbers (C.22).
   */
  calculateGrossSalaryVO(
    overtimeHours: number,
    bonus: number,
    currency: string = 'UZS',
  ): Result<Money> {
    const finiteErr = this.requireFiniteNonNegative({ overtimeHours, bonus });
    if (finiteErr) return finiteErr;
    if (this.props.baseSalary < 0 || !Number.isFinite(this.props.baseSalary)) {
      return Err(AppErr('VALIDATION', `Invalid baseSalary: ${this.props.baseSalary}`));
    }
    const gross = this.calculateGrossSalary(overtimeHours, bonus);
    return Money.of(gross, currency);
  }

  /** Legacy primitive INPS. Prefer `calculateInpsVO`. */
  calculateInps(gross: number, inpsRate: number = PAYROLL_INPS_RATE_DEFAULT): number {
    return Math.round(gross * inpsRate * 100) / 100;
  }

  calculateInpsVO(
    gross: number,
    inpsRate: number = PAYROLL_INPS_RATE_DEFAULT,
    currency: string = 'UZS',
  ): Result<Money> {
    const e = this.requireFiniteNonNegative({ gross, inpsRate });
    if (e) return e;
    return Money.of(Math.round(gross * inpsRate * 100) / 100, currency);
  }

  /** Legacy primitive JSHD. Prefer `calculateJshdVO`. */
  calculateJshd(gross: number, jshdRate: number = PAYROLL_JSHD_RATE_DEFAULT): number {
    return Math.round(gross * jshdRate * 100) / 100;
  }

  calculateJshdVO(
    gross: number,
    jshdRate: number = PAYROLL_JSHD_RATE_DEFAULT,
    currency: string = 'UZS',
  ): Result<Money> {
    const e = this.requireFiniteNonNegative({ gross, jshdRate });
    if (e) return e;
    return Money.of(Math.round(gross * jshdRate * 100) / 100, currency);
  }

  /** Legacy primitive net. Prefer `calculateNetSalaryVO`. */
  calculateNetSalary(gross: number, inps: number, jshd: number, other: number): number {
    const net = gross - inps - jshd - other;
    this.logger.debug(
      `Net calculation - Gross: ${gross}, INPS: ${inps}, JSHD: ${jshd}, Other: ${other}, Net: ${net}`
    );
    return Math.max(0, net);
  }

  calculateNetSalaryVO(
    gross: number,
    inps: number,
    jshd: number,
    other: number,
    currency: string = 'UZS',
  ): Result<Money> {
    const e = this.requireFiniteNonNegative({ gross, inps, jshd, other });
    if (e) return e;
    const net = Math.max(0, gross - inps - jshd - other);
    return Money.of(net, currency);
  }

  /**
   * Shared validation gate for tax / salary inputs — returns `Err` if any
   * field is non-finite or negative; otherwise `null`. We rely on the caller
   * to immediately propagate via early return.
   */
  private requireFiniteNonNegative(fields: Record<string, number>): Result<Money> | null {
    for (const [name, v] of Object.entries(fields)) {
      if (typeof v !== 'number' || !Number.isFinite(v)) {
        return Err(AppErr('VALIDATION', `${name} must be a finite number (got ${v})`));
      }
      if (v < 0) {
        return Err(AppErr('VALIDATION', `${name} must be non-negative (got ${v})`));
      }
    }
    return null;
  }

  emitSalaryCalculation(
    gross: number,
    inps: number,
    jshd: number,
    netSalary: number
  ): void {
    const event = new SalaryCalculatedEvent({
      employeeId: this.props.id.value,
      departmentId: this.props.departmentId,
      gross,
      inps,
      jshd,
      netSalary,
      calculatedAt: _time.now(),
    });
    this.events.push(event);
    this.logger.debug(`Salary calculated event emitted for employee ${this.props.id.value}`);
  }

  getDomainEvents(): DomainEvent[] {
    return this.events;
  }

  clearDomainEvents(): void {
    this.events = [];
  }
}
