/**
 * @module deal-won.listener
 * @description PA2-18 / T18-C3: canonical CQRS @EventsHandler form. When CRM
 *   publishes DealWonEvent (Trigger 2), the SD module dispatches CreateOrderCommand
 *   to auto-create a sales order, then writes the link BOTH ways so the CRM→SD
 *   golden thread is complete: crm_deals.sales_order_id ← new SO id, and
 *   sales_orders.deal_id / crm_deal_id ← the deal uuid. No fabrication — every
 *   value comes from the real DealWonEvent payload. Published via `eventBus.publish`
 *   in `mark-deal-won.handler.ts`.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { DealWonEvent } from '@modules/crm/domain/events/deal-won.event';
import { CreateOrderCommand } from '../../application/commands/create-order.handler';

@Injectable()
@EventsHandler(DealWonEvent)
export class DealWonListener implements IEventHandler<DealWonEvent> {
  private readonly logger = new Logger(DealWonListener.name);
  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: DealWonEvent): Promise<void> {
    this.logger.log({
      msg: 'Deal won event received in SD module - Trigger 2',
      dealId: event.dealId,
      dealUuid: event.dealUuid,
      companyId: event.companyId,
      totalAmount: event.totalAmount,
    });

    try {
      // BUG #17 idempotency (this is now the SINGLE canonical DealWonEvent→SO creator):
      // never create a second sales order for a deal that already has one. A re-published
      // or retried DealWonEvent must be a no-op. Keyed on the real deal uuid we write back
      // (deal_id uuid / crm_deal_id varchar). Skip the guard only when we have no uuid.
      if (event.dealUuid) {
        const existing = await this._findExistingOrder(event.dealUuid);
        if (existing != null) {
          this.logger.log({
            msg: 'Sales order already exists for deal — skipping (idempotent)',
            dealId: event.dealId,
            dealUuid: event.dealUuid,
            orderId: existing,
          });
          return;
        }
      }

      // Avtomatik SO yaratish. 2.6 golden-thread: forward the originating CRM
      // lead (crm_leads.id), when the deal itself came from a lead, so the
      // created order records crm_lead_id instead of leaving it NULL.
      const command = new CreateOrderCommand(
        event.companyId,
        event.totalAmount,
        event.currency ?? 'UZS',
        false,
        false,
        event.assignedTo,
        event.dealId,
        undefined,
        [],
        event.leadId,
      );

      const result = await this.commandBus.execute(command);

      if (result.ok) {
        const orderId = (result).data?.getId();
        this.logger.log({
          msg: 'Sales order automatically created from deal',
          dealId: event.dealId,
          orderId,
        });

        // Golden-thread back-link (Trigger 2 completion). Only when we have the
        // real deal uuid AND a created SO id — otherwise skip gracefully.
        if (event.dealUuid && orderId != null) {
          await this._linkDealToOrder(event.dealUuid, Number(orderId));
        }
      } else {
        this.logger.error({
          msg: 'Failed to create sales order from deal',
          dealId: event.dealId,
          error: result.error,
        });
      }
    } catch (error: unknown) {
      this.logger.error({
        msg: 'Exception while handling deal won event',
        dealId: event.dealId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Idempotency guard (BUG #17): returns the id of an existing sales order already
   * linked to this deal, or null. Matches on either deal-link column. Tolerant of a
   * malformed/non-uuid dealUuid — a query error is swallowed and treated as "no match"
   * so a lookup failure never blocks legitimate first-time creation.
   */
  private async _findExistingOrder(dealUuid: string): Promise<number | null> {
    try {
      const res = await runQuery<{ id: number }>(sql`
        SELECT id FROM sales_orders
        WHERE (deal_id = ${dealUuid}::uuid OR crm_deal_id = ${dealUuid})
          AND deleted_at IS NULL
        LIMIT 1
      `);
      const row = Array.isArray(res.rows) ? res.rows[0] : undefined;
      if (!row) return null;
      const id = Number(row.id);
      return Number.isFinite(id) && id > 0 ? id : null;
    } catch (error: unknown) {
      this.logger.warn({
        msg: 'Idempotency lookup failed (treating as no existing order)',
        dealUuid,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Persists the bidirectional CRM↔SD link. crm_deals is an updatable VIEW over
   * `deals`; sales_orders.deal_id is uuid, crm_deal_id is varchar. Idempotent:
   * re-running on the same deal/order is a no-op overwrite of the same values.
   */
  private async _linkDealToOrder(dealUuid: string, orderId: number): Promise<void> {
    try {
      // VISION-3340 #32: crm_deals.sales_order_id is now integer (was varchar) with a
      // real FK to sales_orders(id) -- bind the integer orderId directly, not String(orderId).
      await runQuery(sql`
        UPDATE crm_deals
        SET sales_order_id = ${orderId}
        WHERE id = ${dealUuid}::uuid AND deleted_at IS NULL
      `);
      await runQuery(sql`
        UPDATE sales_orders
        SET deal_id = ${dealUuid}::uuid,
            crm_deal_id = ${dealUuid}
        WHERE id = ${orderId}
      `);
      this.logger.log({ msg: 'CRM deal linked to sales order', dealUuid, orderId });
    } catch (error: unknown) {
      // Non-fatal: the SO already exists; a failed link is logged, not thrown,
      // so the won-transition is not rolled back.
      this.logger.error({
        msg: 'Failed to link CRM deal to sales order',
        dealUuid,
        orderId,
        error: (error as Error).message,
      });
    }
  }
}
