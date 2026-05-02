import { DomainEvent } from '@shared/domain/domain-event';

export interface SalaryCalculatedEventProps {
  employeeId: number;
  departmentId: number;
  gross: number;
  inps: number;
  jshd: number;
  netSalary: number;
  calculatedAt: Date;
}

export class SalaryCalculatedEvent extends DomainEvent {
  constructor(public readonly props: SalaryCalculatedEventProps) {
    super(String(props.employeeId), 'SalaryCalculated');
  }
}
