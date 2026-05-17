/**
 * @module payroll-run-completed.event
 * @description Emitted when an individual PayrollRecord transitions to
 * `posted` via PayrollRecord.completeRun(). The period-level rollup event
 * `payroll.period.closed` (legacy EventEmitter2 emit in PayrollService.closePeriod)
 * stays in place — this domain event fires once per employee record, so
 * consumers can react to per-employee outcomes (e.g. send a payslip).
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface PayrollRunCompletedEventProps {
  payrollRecordId: number;
  employeeId: number;
  periodId: number;
  netAmount: number;
  completedAt: Date;
}

export class PayrollRunCompletedEvent extends DomainEvent {
  constructor(public readonly props: PayrollRunCompletedEventProps) {
    super(String(props.payrollRecordId), 'PayrollRunCompleted');
  }
}
