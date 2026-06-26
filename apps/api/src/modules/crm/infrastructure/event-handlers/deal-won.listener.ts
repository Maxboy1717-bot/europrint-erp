/**
 * @module deal-won.listener
 * @description GOLDEN-THREAD CRM→SD ENTRY (A63). When a CRM deal is won, create the
 *   canonical `sales_orders` row and emit the golden-thread `sd.order.created` event
 *   so the chain SD→PP→MES→QC→WMS→FIN can pick it up. Before this the listener only
 *   logged ("Signaling SD module") and NOTHING was created — the deal→sales_order link
 *   was 0/4 (memory: A63 "hozir 0/4 link"). This closes it.
 *
 * Reacts to `DealWonEvent` published on the CQRS EventBus by `mark-deal-won.handler.ts`.
 *
 * WHY raw SQL (deliberate, mirrors `lead-converted-customer.listener.ts`):
 *   - `crm_deals.id` is a **uuid** in the live DB (Bitrix-style table), so the
 *     CQRS `dealId: number` carried by the event can be `NaN` for real deals. We
 *     therefore re-read the authoritative deal row from `crm_deals` matching on
 *     `id::text` — this works for uuid AND integer ids — and use the event payload
 *     only as a fallback. No fabricated data: amount/currency/company come from the
 *     real deal row.
 *   - `sales_orders` has 72 live columns (the Drizzle `salesOrders` shim diverges:
 *     `crm_deal_id`/`customer_name` etc.). Raw SQL targets the LIVE columns directly.
 *
 * Atomicity (PA0-6 pattern, mirrors create-test-order.handler): the `sales_orders`
 * INSERT, the `crm_deals.sales_order_id` back-link UPDATE, and the `domain_events`
 * outbox INSERT all share ONE `db.transaction`. If any step fails, all roll back —
 * a "saved order without its golden-thread event" state is impossible.
 *
 * Idempotent: if a `sales_orders` row already references this deal (`crm_deal_id`),
 * the listener skips creation so a re-published / retried event never duplicates the
 * order.
 *
 * Best-effort by design (does not throw to the bus): the deal-win itself already
 * committed upstream; failing to spin up the sales order must not crash the publisher.
 * All failures are logged + swallowed (consistent with the sibling CRM listeners).
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';
import { DealWonEvent } from '../../domain/events/deal-won.event';

type Row = Record<string, unknown>;

/** Status a freshly-created sales order opens in (matches sales_orders default). */
const NEW_ORDER_STATUS = 'pending';

@Injectable()
@EventsHandler(DealWonEvent)
export class DealWonListener implements IEventHandler<DealWonEvent> {
  private readonly logger = new Logger(DealWonListener.name);

  async handle(event: DealWonEvent): Promise<void> {
    const dealRef = String(event.dealId);
    try {
      // 1) Resolve the authoritative deal row. `id::text` match handles both the
      //    live uuid keys and any integer id the event may carry. The event payload
      //    is the fallback source if the row is unreadable.
      const deal = await this.loadDeal(dealRef);

      // 2) Idempotency: never create a second sales order for the same deal.
      const already = await this.findExistingOrder(dealRef);
      if (already !== null) {
        this.logger.log({
          msg: 'CRM→SD: sales order already exists for deal, skipping',
          dealId: dealRef,
          salesOrderId: already,
        });
        return;
      }

      // 3) Build the order fields — real deal data first, event payload as fallback.
      const amount = this.firstFinite(
        deal ? Number(deal['amount']) : NaN,
        deal ? Number(deal['opportunity']) : NaN,
        Number(event.totalAmount),
        0,
      );
      const currency = String(
        (deal?.['currency'] as string) ?? (deal?.['currency_id'] as string) ?? event.currency ?? 'UZS',
      );
      const companyId = this.firstFinite(
        deal ? Number(deal['company_id']) : NaN,
        Number(event.companyId),
      );
      const customerId = deal && deal['customer_id'] != null ? Number(deal['customer_id']) : null;
      const customerName = deal ? (deal['title'] as string | null) ?? null : null;
      const orderNumber = this.generateOrderNumber();
      const notes = `CRM bitim #${dealRef} yutildi → avtomatik sotuv buyurtmasi`;

      // 4) ONE transaction: order INSERT + deal back-link UPDATE + outbox event INSERT.
      const orderId = await db.transaction(async (tx): Promise<number> => {
        const insertRes = await tx.execute<Row>(sql`
          INSERT INTO sales_orders
            (order_number, status, total_amount, currency, company_id,
             customer_id, customer_name, crm_deal_id, notes, created_at, updated_at)
          VALUES
            (${orderNumber}, ${NEW_ORDER_STATUS}, ${amount}, ${currency},
             ${Number.isFinite(companyId) ? companyId : null},
             ${customerId}, ${customerName}, ${dealRef}, ${notes}, NOW(), NOW())
          RETURNING id
        `);
        const newId = Number(this.firstRow(insertRes)?.['id'] ?? 0);
        if (!Number.isFinite(newId) || newId <= 0) {
          throw new Error('sales_orders INSERT returned no id');
        }

        // Back-link the deal → sales order (column exists; closes the link both ways).
        await tx.execute(sql`
          UPDATE crm_deals SET sales_order_id = ${String(newId)}, updated_at = NOW()
          WHERE id::text = ${dealRef}
        `);

        // Golden-thread entry: persist sd.order.created into domain_events so the
        // PP planning listener (and the rest of the chain) can pick it up durably.
        // Payload bound as a parameter (JSON string → ::jsonb) — no sql.raw, no
        // injection surface (Qoida B).
        const orderCreatedPayload = JSON.stringify({
          orderId: newId,
          orderNumber,
          companyId: Number.isFinite(companyId) ? companyId : null,
          totalAmount: amount,
          currency,
          crmDealId: dealRef,
          source: ERP_EVENTS.DEAL_WON,
        });
        await tx.execute(sql`
          INSERT INTO domain_events (aggregate_type, aggregate_id, event_name, payload, occurred_at)
          VALUES (
            'SalesOrder', ${String(newId)}, ${ERP_EVENTS.ORDER_CREATED},
            ${orderCreatedPayload}::jsonb, NOW()
          )
        `);

        // Traceability: also record the CRM-side crm.deal.won event.
        const dealWonPayload = JSON.stringify({
          dealId: dealRef,
          salesOrderId: newId,
          totalAmount: amount,
          currency,
        });
        await tx.execute(sql`
          INSERT INTO domain_events (aggregate_type, aggregate_id, event_name, payload, occurred_at)
          VALUES (
            'Deal', ${dealRef}, ${ERP_EVENTS.DEAL_WON},
            ${dealWonPayload}::jsonb, NOW()
          )
        `);

        return newId;
      });

      this.logger.log({
        msg: 'CRM→SD: deal won → sales order created (golden-thread entry)',
        dealId: dealRef,
        salesOrderId: orderId,
        orderNumber,
        event: ERP_EVENTS.ORDER_CREATED,
      });
    } catch (error: unknown) {
      // Non-fatal: the deal already won upstream; order creation is best-effort.
      this.logger.error({
        msg: 'CRM→SD: failed to create sales order from won deal',
        dealId: dealRef,
        error: (error as Error)?.message ?? String(error),
      });
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /** Read the authoritative deal row (uuid- and integer-id tolerant). */
  private async loadDeal(dealRef: string): Promise<Row | null> {
    const res = await db.execute<Row>(sql`
      SELECT id::text AS id, title, amount, opportunity, currency, currency_id,
             company_id, customer_id, assigned_by_id
      FROM crm_deals
      WHERE id::text = ${dealRef}
      LIMIT 1
    `);
    return this.firstRow(res);
  }

  /** Existing sales order for this deal (idempotency guard). Returns id or null. */
  private async findExistingOrder(dealRef: string): Promise<number | null> {
    const res = await db.execute<Row>(sql`
      SELECT id FROM sales_orders
      WHERE crm_deal_id = ${dealRef} AND deleted_at IS NULL
      LIMIT 1
    `);
    const row = this.firstRow(res);
    if (!row) return null;
    const id = Number(row['id']);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  /** `CRM-SO-2026-1718...` — origin-tagged order number, collision-safe via timestamp. */
  private generateOrderNumber(): string {
    return `CRM-SO-${new Date().getFullYear()}-${Date.now()}`;
  }

  /** First finite candidate, in priority order. */
  private firstFinite(...vals: number[]): number {
    for (const v of vals) {
      if (Number.isFinite(v)) return v;
    }
    return 0;
  }

  /** Normalise pg `{ rows: [...] }` / array result shapes to the first row. */
  private firstRow(res: unknown): Row | null {
    const list = Array.isArray((res as { rows?: Row[] }).rows)
      ? (res as { rows: Row[] }).rows
      : Array.isArray(res)
        ? (res as Row[])
        : [];
    return list[0] ?? null;
  }
}
