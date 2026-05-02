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
