/**
 * @module website-contact-submitted.event
 * @description Wave 4 round-3 (PA2-18): canonical CQRS event class for the
 *   `ecommerce.website.contact_submitted` topic (ERP_EVENTS.WEBSITE_CONTACT_SUBMITTED).
 *   Trigger 22 — saytda aloqa formasi yuborilganda CRM da yangi lead yaratiladi.
 *
 *   The CRM `WebsiteContactLeadListener` was previously listening via
 *   `@OnEvent(ERP_EVENTS.WEBSITE_CONTACT_SUBMITTED)`; it now subscribes to this
 *   class. EventBridge re-emits to the legacy string topic for any
 *   non-migrated consumers — see EVENT_NAME_MAP entry in event-bridge.service.ts.
 *
 *   Publisher: ecommerce.service.ts → emitWebsiteContact().
 */

import { DomainEvent } from '@shared/domain/domain-event';
import type { WebsiteContactEvent } from '@modules/crm/listeners/website-lead-events.payload';

export class WebsiteContactSubmittedEvent extends DomainEvent {
  constructor(public readonly props: WebsiteContactEvent) {
    super(`${props.phone}|${props.occurredAt}`, 'WebsiteContactSubmitted');
  }
}
