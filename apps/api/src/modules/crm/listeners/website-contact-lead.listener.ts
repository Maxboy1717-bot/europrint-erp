/**
 * @module website-contact-lead.listener
 * @description Wave 4 round-3 (PA2-18): canonical CQRS
 *   `@EventsHandler(WebsiteContactSubmittedEvent)` form. Migrated from the
 *   legacy `@OnEvent(ERP_EVENTS.WEBSITE_CONTACT_SUBMITTED)` string topic to
 *   the canonical event class. EventBridge keeps re-emitting to the legacy
 *   string topic for any non-migrated consumers — see EVENT_NAME_MAP entry in
 *   event-bridge.service.ts.
 *
 *   Trigger 22 — Saytda aloqa formasi yuborilganda → CRM da yangi lead.
 *
 *   Manba: aloqa formasi POST /api/public/contact yoki AI chatbot.
 *   Maqsad: sd_leads (source='website', sub='website_contact'/'chatbot').
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { isErr } from '@common/result';
import { WebsiteLeadService } from './website-lead.service';
import { WebsiteContactEventSchema } from './website-lead-events.payload';
import { WebsiteContactSubmittedEvent } from '../domain/events/website-contact-submitted.event';

@Injectable()
@EventsHandler(WebsiteContactSubmittedEvent)
export class WebsiteContactLeadListener
  implements IEventHandler<WebsiteContactSubmittedEvent>
{
  private readonly logger = new Logger(WebsiteContactLeadListener.name);

  constructor(private readonly leadSvc: WebsiteLeadService) {}

  async handle(event: WebsiteContactSubmittedEvent): Promise<void> {
    const parsed = WebsiteContactEventSchema.safeParse(event.props);
    if (!parsed.success) {
      this.logger.warn(`Trigger 22: noto'g'ri payload — ${parsed.error.message}`);
      return;
    }

    const result = await this.leadSvc.handleWebsiteContact(parsed.data);
    if (isErr(result)) {
      this.logger.error(
        `Trigger 22 fail: ${parsed.data.phone} — ${result.error.message}`,
      );
      return;
    }
    if (result.data.created) {
      this.logger.log(
        `Trigger 22: lead #${result.data.leadId} channel=${parsed.data.channel} manager=${result.data.managerId ?? '—'}`,
      );
    }
  }
}
