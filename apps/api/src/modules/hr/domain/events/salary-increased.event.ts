/**
 * @module salary-increased.event
 * @description Emitted when PayrollRecord.increaseSalary succeeds. Carries
 * the old/new gross and the delta so downstream consumers (HR dashboard, GL,
 * notification bot) don't have to recompute it.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface SalaryIncreasedEventProps {
  payrollRecordId: number;
  employeeId: number;
  periodId: number;
  oldGross: number;
  newGross: number;
  delta: number;
  changedBy: string;
  changedAt: Date;
}

export class SalaryIncreasedEvent extends DomainEvent {
  constructor(public readonly props: SalaryIncreasedEventProps) {
    super(String(props.payrollRecordId), 'SalaryIncreased');
  }
}
