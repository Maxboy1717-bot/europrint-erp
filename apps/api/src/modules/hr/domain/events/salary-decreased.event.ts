/**
 * @module salary-decreased.event
 * @description Emitted when PayrollRecord.decreaseSalary succeeds. `delta`
 * is the signed difference (newGross - oldGross), so consumers can sum
 * salary movements over a period without re-reading the salary history.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface SalaryDecreasedEventProps {
  payrollRecordId: number;
  employeeId: number;
  periodId: number;
  oldGross: number;
  newGross: number;
  delta: number;
  changedBy: string;
  changedAt: Date;
}

export class SalaryDecreasedEvent extends DomainEvent {
  constructor(public readonly props: SalaryDecreasedEventProps) {
    super(String(props.payrollRecordId), 'SalaryDecreased');
  }
}
