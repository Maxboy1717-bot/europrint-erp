import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Logger } from '@nestjs/common';
import { DomainEvent } from '@shared/domain/domain-event';
import { SalaryCalculatedEvent } from '../events/salary-calculated.event';

export interface EmployeeProps {
  id: number;
  userId: number;
  departmentId: number;
  positionId: number;
  employmentType: 'monthly' | 'piecework';
  baseSalary: number;
  status: 'active' | 'on_leave' | 'terminated';
}

export class Employee {
  private readonly logger = new Logger(Employee.name);
  private events: DomainEvent[] = [];

  constructor(private props: EmployeeProps) {}

  static create(props: EmployeeProps): Employee {
    return new Employee(props);
  }

  get id(): number { return this.props.id; }
  get userId(): number { return this.props.userId; }
  get departmentId(): number { return this.props.departmentId; }
  get positionId(): number { return this.props.positionId; }
  get baseSalary(): number { return this.props.baseSalary; }
  get status(): string { return this.props.status; }

  calculateGrossSalary(overtimeHours: number, bonus: number): number {
    const base = this.props.baseSalary;
    const overtime = overtimeHours * (base / 176) * 1.5;
    const gross = base + overtime + bonus;
    this.logger.debug(
      `Gross calculation - Base: ${base}, OT: ${overtime}, Bonus: ${bonus}, Total: ${gross}`
    );
    return gross;
  }

  calculateInps(gross: number, inpsRate: number): number {
    return Math.round(gross * inpsRate * 100) / 100;
  }

  calculateJshd(gross: number, jshdRate: number): number {
    return Math.round(gross * jshdRate * 100) / 100;
  }

  calculateNetSalary(
    gross: number,
    inps: number,
    jshd: number,
    other: number
  ): number {
    const net = gross - inps - jshd - other;
    this.logger.debug(
      `Net calculation - Gross: ${gross}, INPS: ${inps}, JSHD: ${jshd}, Other: ${other}, Net: ${net}`
    );
    return Math.max(0, net);
  }

  emitSalaryCalculation(
    gross: number,
    inps: number,
    jshd: number,
    netSalary: number
  ): void {
    const event = new SalaryCalculatedEvent({
      employeeId: this.props.id,
      departmentId: this.props.departmentId,
      gross,
      inps,
      jshd,
      netSalary,
      calculatedAt: _time.now(),
    });
    this.events.push(event);
    this.logger.debug(`Salary calculated event emitted for employee ${this.props.id}`);
  }

  getDomainEvents(): DomainEvent[] {
    return this.events;
  }

  clearDomainEvents(): void {
    this.events = [];
  }
}
