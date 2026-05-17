/**
 * @module leave-approved.event
 * @description Domain event payload. Emitted via @nestjs/event-emitter or CQRS event bus.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface LeaveApprovedEventProps {
  leaveId: string;
  employeeId: string;
  userId: string;
  approverId: string;
  approvedAt: Date;
}

export class LeaveApprovedEvent extends DomainEvent {
  constructor(public readonly props: LeaveApprovedEventProps) {
    super(String(props.leaveId), 'LeaveApproved');
  }
}
