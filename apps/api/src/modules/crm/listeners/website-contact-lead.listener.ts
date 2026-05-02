import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';
import { isErr } from '@common/result';
import { WebsiteLeadService } from './website-lead.service';
import {
  WebsiteContactEventSchema,
  type WebsiteContactEvent,
} from './website-lead-events.payload';

/**
 * Trigger 22 — Saytda aloqa formasi yuborilganda → CRM da yangi lead.
 *
 * Manba: aloqa formasi POST /api/public/contact yoki AI chatbot
 * Maqsad: sd_leads (source='website', sub='website_contact'/'chatbot')
 */
@Injectable()
export class WebsiteContactLeadListener {
  private readonly logger = new Logger(WebsiteContactLeadListener.name);

  constructor(private readonly leadSvc: WebsiteLeadService) {}

  @OnEvent(ERP_EVENTS.WEBSITE_CONTACT_SUBMITTED, { async: true, promisify: true })
  async handle(payload: WebsiteContactEvent): Promise<void> {
    const parsed = WebsiteContactEventSchema.safeParse(payload);
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
