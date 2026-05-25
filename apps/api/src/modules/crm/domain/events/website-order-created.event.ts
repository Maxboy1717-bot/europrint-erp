/**
 * @module website-order-created.event
 * @description Wave 4 round-3 (PA2-18): canonical CQRS event class for the
 *   `ecommerce.website.order_created` topic (ERP_EVENTS.WEBSITE_ORDER_CREATED).
 *   Trigger 21 — saytdan buyurtma kelganda CRM da yangi lead yaratiladi.
 *
 *   The CRM `WebsiteOrderLeadListener` was previously listening via
 *   `@OnEvent(ERP_EVENTS.WEBSITE_ORDER_CREATED)`; it now subscribes to this
 *   class. EventBridge re-emits to the legacy string topic for any
 *   non-migrated consumers — see EVENT_NAME_MAP entry in event-bridge.service.ts.
 *
 *   Publisher: ecommerce.service.ts → createPublicOrderFromBody().
 */

import { DomainEvent } from '@shared/domain/domain-event';
import type { WebsiteOrderEvent } from '@modules/crm/listeners/website-lead-events.payload';

export class WebsiteOrderCreatedEvent extends DomainEvent {
  constructor(public readonly props: WebsiteOrderEvent) {
    super(String(props.orderId), 'WebsiteOrderCreated');
  }
}
