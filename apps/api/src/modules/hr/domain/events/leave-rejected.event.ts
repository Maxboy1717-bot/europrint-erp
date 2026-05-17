/**
 * @module leave-rejected.event
 * @description Domain event payload. Emitted via @nestjs/event-emitter or CQRS event bus.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface LeaveRejectedEventProps {
  leaveId: string;
  employeeId: string;
  userId: string;
  rejectorId: string;
  reason: string;
  rejectedAt: Date;
}

export class LeaveRejectedEvent extends DomainEvent {
  constructor(public readonly props: LeaveRejectedEventProps) {
    super(String(props.leaveId), 'LeaveRejected');
  }
}
