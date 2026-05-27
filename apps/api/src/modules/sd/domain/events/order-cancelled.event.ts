/**
 * @module order-cancelled.event
 * @description Domain event payload. Emitted via @nestjs/event-emitter or CQRS event bus.
 *
 * Canonical single-source-of-truth for OrderCancelledEvent. Previously the
 * kanban module defined this class locally (class identity mismatch risk).
 * All consumers must import from this path.
 */

import { DomainEvent } from '@shared/domain/domain-event.base';

export class OrderCancelledEvent extends DomainEvent {
  readonly aggregateName: string = 'SalesOrder';

  constructor(
    public readonly orderId: number,
    public readonly orderNumber: string,
  ) {
    super(orderId, 'OrderCancelled');
  }
}
