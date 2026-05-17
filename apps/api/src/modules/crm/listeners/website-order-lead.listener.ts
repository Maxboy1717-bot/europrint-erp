/**
 * @module website-order-lead.listener
 * @description Wave 4 round-3 (PA2-18): canonical CQRS
 *   `@EventsHandler(WebsiteOrderCreatedEvent)` form. Migrated from the legacy
 *   `@OnEvent(ERP_EVENTS.WEBSITE_ORDER_CREATED)` string topic to the canonical
 *   event class. EventBridge keeps re-emitting to the legacy string topic for
 *   any non-migrated consumers — see EVENT_NAME_MAP entry in
 *   event-bridge.service.ts.
 *
 *   Trigger 21 — Saytdan buyurtma kelganda → CRM da yangi lead.
 *
 *   Manba: EcommerceService.createPublicOrderFromBody (currently emits via
 *   EventEmitter2 string topic; EventBridge bridges it to the CQRS bus).
 *   Maqsad: sd_leads (source='website') + Telegram sotuv guruh.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { isErr } from '@common/result';
import { WebsiteLeadService } from './website-lead.service';
import { WebsiteOrderEventSchema } from './website-lead-events.payload';
import { WebsiteOrderCreatedEvent } from '../domain/events/website-order-created.event';

@Injectable()
@EventsHandler(WebsiteOrderCreatedEvent)
export class WebsiteOrderLeadListener
  implements IEventHandler<WebsiteOrderCreatedEvent>
{
  private readonly logger = new Logger(WebsiteOrderLeadListener.name);

  constructor(private readonly leadSvc: WebsiteLeadService) {}

  async handle(event: WebsiteOrderCreatedEvent): Promise<void> {
    const parsed = WebsiteOrderEventSchema.safeParse(event.props);
    if (!parsed.success) {
      this.logger.warn(`Trigger 21: noto'g'ri payload — ${parsed.error.message}`);
      return;
    }

    const result = await this.leadSvc.handleWebsiteOrder(parsed.data);
    if (isErr(result)) {
      this.logger.error(
        `Trigger 21 fail: order ${parsed.data.orderNumber} — ${result.error.message}`,
      );
      return;
    }
    if (result.data.created) {
      this.logger.log(
        `Trigger 21: lead #${result.data.leadId} order=${parsed.data.orderNumber} manager=${result.data.managerId ?? '—'}`,
      );
    } else {
      this.logger.debug(
        `Trigger 21: dublikat (oxirgi 24 soat) — lead #${result.data.leadId}`,
      );
    }
  }
}
