import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';
import { isErr } from '@common/result';
import { WebsiteLeadService } from './website-lead.service';
import {
  WebsiteOrderEventSchema,
  type WebsiteOrderEvent,
} from './website-lead-events.payload';

/**
 * Trigger 21 — Saytdan buyurtma kelganda → CRM da yangi lead.
 *
 * Manba: EcommerceService.createPublicOrderFromBody
 * Maqsad: sd_leads (source='website') + Telegram sotuv guruh
 */
@Injectable()
export class WebsiteOrderLeadListener {
  private readonly logger = new Logger(WebsiteOrderLeadListener.name);

  constructor(private readonly leadSvc: WebsiteLeadService) {}

  @OnEvent(ERP_EVENTS.WEBSITE_ORDER_CREATED, { async: true, promisify: true })
  async handle(payload: WebsiteOrderEvent): Promise<void> {
    const parsed = WebsiteOrderEventSchema.safeParse(payload);
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
