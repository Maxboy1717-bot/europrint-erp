/**
 * @module lead-converted.event
 * @description Emitted when a qualified Lead is converted to a Deal.
 *   - Subscribers: notifications (sales team alert), analytics (conversion funnel),
 *     CRM dashboard (deal pipeline refresh).
 */

import { DomainEvent } from '@shared/domain/domain-event.base';

export class LeadConvertedEvent extends DomainEvent {
  readonly aggregateName: string = 'Lead';

  constructor(
    public readonly leadId: number,
    public readonly dealId: number,
    public readonly companyId: number,
    public readonly expectedDealAmount: number,
    public readonly currency: string = 'UZS',
  ) {
    super(leadId, 'LeadConverted');
  }
}
