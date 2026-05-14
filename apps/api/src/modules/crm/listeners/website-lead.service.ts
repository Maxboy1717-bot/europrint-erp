/**
 * @module website-lead.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, Ok, Err, AppErr, isErr } from '@common/result';
import { WebsiteLeadRepository } from './website-lead.repository';
import { TelegramService } from '../../../telegram/telegram.service';
import { TG_ROUTE_KEYS } from '@common/constants/telegram-routes.constants';
import {
  type WebsiteOrderEvent,
  type WebsiteContactEvent,
} from './website-lead-events.payload';

interface CreateLeadResult {
  leadId: number;
  created: boolean;
  managerId: number | null;
}

/**
 * Saytdan kelgan order/contact'larni CRM lead'ga aylantiradi.
 * Trigger 21 va 22 — ARCHITECTURE.md §10.
 */
@Injectable()
export class WebsiteLeadService {
  private readonly logger = new Logger(WebsiteLeadService.name);

  constructor(
    private readonly repo: WebsiteLeadRepository,
    private readonly config: ConfigService,
    @Optional() private readonly telegram?: TelegramService,
  ) {}

  /**
   * Trigger 21 — saytdan buyurtma kelganda lead yaratadi.
   */
  async handleWebsiteOrder(event: WebsiteOrderEvent): Promise<Result<CreateLeadResult>> {
    const managerR = await this.repo.pickNextSalesManager();
    if (isErr(managerR)) return Err(managerR.error);
    const managerId = managerR.data;

    const insertR = await this.repo.insertWebsiteLead({
      contactName: event.customerName ?? 'Sayt mehmon',
      contactPhone: event.customerPhone,
      contactEmail: event.customerEmail ?? null,
      productInterest: `Sayt buyurtmasi #${event.orderNumber}`,
      estimatedValue: event.totalAmount,
      managerId,
      subSource: event.subSource,
      metadata: {
        orderId: event.orderId,
        orderNumber: event.orderNumber,
        itemsCount: event.itemsCount,
        deliveryCity: event.deliveryCity ?? null,
        paymentMethod: event.paymentMethod ?? null,
      },
    });
    if (isErr(insertR)) return Err(insertR.error);

    if (insertR.data.created && managerId !== null) {
      await this.notifySalesGroup({
        kind: 'order',
        leadId: insertR.data.leadId,
        managerId,
        event,
      });
    }

    return Ok({ leadId: insertR.data.leadId, created: insertR.data.created, managerId });
  }

  /**
   * Trigger 22 — saytda aloqa formasi yuborilganda lead yaratadi.
   */
  async handleWebsiteContact(event: WebsiteContactEvent): Promise<Result<CreateLeadResult>> {
    const managerR = await this.repo.pickNextSalesManager();
    if (isErr(managerR)) return Err(managerR.error);
    const managerId = managerR.data;

    const insertR = await this.repo.insertWebsiteLead({
      contactName: event.name,
      contactPhone: event.phone,
      contactEmail: event.email ?? null,
      productInterest: event.message
        ? `Aloqa formasi: ${event.message.slice(0, 200)}`
        : 'Aloqa formasi',
      estimatedValue: null,
      managerId,
      subSource:
        event.channel === 'chatbot' ? 'chatbot' as const : 'website_contact' as const,
      metadata: { channel: event.channel },
    });
    if (isErr(insertR)) return Err(insertR.error);

    if (insertR.data.created && managerId !== null) {
      await this.notifySalesGroup({
        kind: 'contact',
        leadId: insertR.data.leadId,
        managerId,
        event,
      });
    }

    return Ok({ leadId: insertR.data.leadId, created: insertR.data.created, managerId });
  }

  private async notifySalesGroup(args:
    | { kind: 'order'; leadId: number; managerId: number; event: WebsiteOrderEvent }
    | { kind: 'contact'; leadId: number; managerId: number; event: WebsiteContactEvent }
  ): Promise<void> {
    if (!this.telegram) return;
    const groupChatId = this.config.get<string>(TG_ROUTE_KEYS.SALES_GROUP);
    if (!groupChatId) {
      this.logger.warn(`Telegram ${TG_ROUTE_KEYS.SALES_GROUP} ENV o'rnatilmagan`);
      return;
    }
    const text = args.kind === 'order'
      ? this.formatOrderMessage(args.leadId, args.event)
      : this.formatContactMessage(args.leadId, args.event);

    const sendR = await this.telegram.sendMessage(groupChatId, text);
    if (isErr(sendR)) {
      this.logger.warn(`Telegram xabar yuborilmadi: ${sendR.error.message}`);
    }
  }

  private formatOrderMessage(leadId: number, e: WebsiteOrderEvent): string {
    const parts = [
      '🛒 <b>Yangi sayt buyurtmasi</b>',
      `Buyurtma: <code>${e.orderNumber}</code>`,
      `Mijoz: ${e.customerName ?? '—'}`,
      `Tel: <code>${e.customerPhone}</code>`,
      `Summa: ${e.totalAmount.toLocaleString()} UZS`,
      e.deliveryCity ? `Shahar: ${e.deliveryCity}` : '',
      `CRM Lead ID: <code>${leadId}</code>`,
    ];
    return parts.filter((p) => p.length > 0).join('\n');
  }

  private formatContactMessage(leadId: number, e: WebsiteContactEvent): string {
    const parts = [
      '📩 <b>Yangi sayt aloqasi</b>',
      `Mijoz: ${e.name}`,
      `Tel: <code>${e.phone}</code>`,
      e.email ? `Email: ${e.email}` : '',
      e.message ? `Xabar: ${e.message.slice(0, 300)}` : '',
      `Manba: ${e.channel}`,
      `CRM Lead ID: <code>${leadId}</code>`,
    ];
    return parts.filter((p) => p.length > 0).join('\n');
  }
}
