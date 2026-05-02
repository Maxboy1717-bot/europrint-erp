import { DomainEvent } from '@shared/domain/domain-event.base';

export class AdvanceCheckFailedEvent extends DomainEvent {
  readonly aggregateName: string = 'SalesOrder';

  constructor(
    public readonly orderId: number,
    public readonly advanceRequired: number,
    public readonly advancePaid: number,
    public readonly reason: string,
  ) {
    super(orderId, 'AdvanceCheckFailed');
  }
}
