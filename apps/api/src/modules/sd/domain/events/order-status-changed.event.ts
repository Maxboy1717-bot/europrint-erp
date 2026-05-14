/**
 * @module order-status-changed.event
 * @description Domain event payload. Emitted via @nestjs/event-emitter or CQRS event bus.
 */

import { DomainEvent } from '@shared/domain/domain-event.base';

export class OrderStatusChangedEvent extends DomainEvent {
  readonly aggregateName: string = 'SalesOrder';

  constructor(
    public readonly orderId: number,
    public readonly previousStatus: string,
    public readonly newStatus: string,
  ) {
    super(orderId, 'OrderStatusChanged');
  }
}
