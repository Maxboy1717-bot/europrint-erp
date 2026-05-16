/**
 * @module deal-lost.event
 * @description Emitted when a Deal transitions to 'lost'.
 *   - Subscribers: analytics (loss reasons aggregation), churn-risk scorer
 *     (signal for company-level churn), sales manager notification.
 */

import { DomainEvent } from '@shared/domain/domain-event.base';

export class DealLostEvent extends DomainEvent {
  readonly aggregateName: string = 'Deal';

  constructor(
    public readonly dealId: number,
    public readonly companyId: number,
    public readonly totalAmount: number,
    public readonly assignedTo: number,
    public readonly reason: string,
    public readonly currency: string = 'UZS',
  ) {
    super(dealId, 'DealLost');
  }
}
