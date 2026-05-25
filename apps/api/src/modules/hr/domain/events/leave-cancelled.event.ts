/**
 * @module leave-cancelled.event
 * @description Domain event payload. Emitted via @nestjs/event-emitter or CQRS event bus.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface LeaveCancelledEventProps {
  leaveId: string;
  employeeId: string;
  userId: string;
  cancelledAt: Date;
  /** Previous status before cancellation: PENDING or APPROVED */
  previousStatus: 'pending' | 'approved';
}

export class LeaveCancelledEvent extends DomainEvent {
  constructor(public readonly props: LeaveCancelledEventProps) {
    super(String(props.leaveId), 'LeaveCancelled');
  }
}
