/**
 * @module auto-invoice.listener
 * @description VISION-3340 #50 — auto-invoice on billable-status transition.
 *
 * Listens for `OrderStatusChangedEvent` (published in-process by SD's
 * update-order-status.handler after the status UPDATE + outbox row commit).
 * Before this listener, `CreateInvoiceCommand` was only ever dispatched
 * manually from SdInvoicesController — an order could pass through every
 * billable status without a single invoice draft existing, so finance had to
 * notice and type one by hand.
 *
 * WHAT IT DOES
 *   When the transition lands on an invoiceable status (same status set the
 *   CreateInvoiceHandler enforces) and NO invoice row already references the
 *   order, it loads the order's real line items (sales_order_items) + customer
 *   name (sd_customers via sales_orders.customer_id) and dispatches
 *   CreateInvoiceCommand. The invoice is created as a normal 'draft' by the
 *   existing handler — no parallel insert path, no new table.
 *
 * IDEMPOTENCY / NO DUPLICATES
 *   INVOICEABLE_STATUSES contains many statuses, so one order fires this
 *   listener on several consecutive transitions (approved → in_production →
 *   shipped ...). The `invoices.sales_order_id` existence check (soft-deleted
 *   rows excluded) makes every fire after the first a logged no-op. The
 *   `::text` cast keeps the probe working across the known id-type drift
 *   (live integer vs drizzle-stub uuid — see drizzle-sales-order.repo notes).
 *
 * Q-40 (no fabrication)
 *   The command needs a customer name and an acting user. Both come from real
 *   order data (sd_customers.name, sales_orders.created_by_user_id — T8-01).
 *   If either is missing the listener SKIPS with a warn log instead of
 *   inventing values; the manual controller path stays available.
 *
 * WHY NO Result<T> RETURN
 *   Event handlers are fire-and-forget (same as OrderMaterialWaitingListener):
 *   all failures are caught + logged so an invoice hiccup never crashes the
 *   event loop or sibling listeners (PP planning, logistics) on the same event.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { TashkentTimeService } from '@common/time';
import type { Result } from '@common/result';
import { OrderStatusChangedEvent } from '../../domain/events/order-status-changed.event';
import {
  CreateInvoiceCommand,
  InvoiceItem,
} from '../../application/commands/create-invoice.command';

const _time = new TashkentTimeService();

/**
 * Mirror of the module-private INVOICEABLE_STATUSES in
 * ../../application/commands/create-invoice.handler.ts:15 (not exported there;
 * that file is the enforcement point and re-validates the order's live status
 * inside its transaction, so any drift here fails CLOSED — the handler simply
 * rejects and no invoice is created).
 */
const INVOICEABLE_STATUSES = new Set([
  'approved', 'pending_advance', 'ready_for_planning',
  'in_planning', 'completed_planning', 'ready_for_production',
  'in_production', 'ready_for_shipment', 'shipped', 'delivered',
]);

/** QQS default — mirrors InvoiceItemSchema.taxRate `.default(12)` (presentation/dto/sd-invoice.dto.ts). */
const AUTO_INVOICE_TAX_RATE_PERCENT = 12;

/**
 * Payment term for the auto-created DRAFT invoice (manual flow makes the user
 * pick a due date; the draft stays editable by finance before issue).
 */
const AUTO_INVOICE_DUE_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type Row = Record<string, unknown>;

@Injectable()
@EventsHandler(OrderStatusChangedEvent)
export class AutoInvoiceListener implements IEventHandler<OrderStatusChangedEvent> {
  private readonly logger = new Logger(AutoInvoiceListener.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: OrderStatusChangedEvent): Promise<void> {
    const orderId = Number(event?.orderId);
    if (!Number.isFinite(orderId) || orderId <= 0) return;

    const newStatus = String(event?.newStatus ?? '');
    if (!INVOICEABLE_STATUSES.has(newStatus)) return;

    try {
      // 1) Duplicate guard — one invoice per order from this path. Soft-deleted
      //    invoices don't count (finance removing a bad draft re-opens the door).
      const existing = await db.execute(sql`
        SELECT id FROM invoices
        WHERE sales_order_id::text = ${String(orderId)} AND deleted_at IS NULL
        LIMIT 1
      `);
      if ((existing.rows ?? []).length > 0) {
        this.logger.log({
          msg: 'Auto-invoice: invoice already exists for order — skipped (idempotent)',
          orderId,
          newStatus,
        });
        return;
      }

      // 2) Real order data — customer name via the canonical sd_customers join
      //    (same join every SD list query uses), creator via T8-01 created_by_user_id.
      const orderRes = await db.execute(sql`
        SELECT o.id, o.customer_id, o.created_by_user_id, c.name AS customer_name
        FROM sales_orders o
        LEFT JOIN sd_customers c ON c.id = o.customer_id
        WHERE o.id = ${orderId} AND o.deleted_at IS NULL
        LIMIT 1
      `);
      const orderRows = Array.isArray(orderRes.rows) ? (orderRes.rows as Row[]) : [];
      const order = orderRows[0];
      if (!order) {
        this.logger.warn({ msg: 'Auto-invoice: order not found (or deleted) — skipped', orderId });
        return;
      }

      const customerName = order.customer_name != null ? String(order.customer_name) : '';
      if (!customerName) {
        // Q-40: never fabricate a customer name — invoices.customer_name is NOT NULL real data.
        this.logger.warn({
          msg: 'Auto-invoice: order has no linked customer (sd_customers.name missing) — skipped, create manually',
          orderId,
        });
        return;
      }

      const createdByUserId = order.created_by_user_id != null ? String(order.created_by_user_id) : '';
      if (!createdByUserId) {
        // Q-40: invoices.created_by is NOT NULL — no real acting user, no invoice.
        this.logger.warn({
          msg: 'Auto-invoice: order has no created_by_user_id — skipped, create manually',
          orderId,
        });
        return;
      }

      // 3) The order's line items (live integer FK — see drizzle-sales-order.repo saveItems).
      const itemsRes = await db.execute(sql`
        SELECT description, order_quantity, net_price
        FROM sales_order_items
        WHERE sales_order_id = ${orderId}
        ORDER BY item_number ASC
      `);
      const itemRows = Array.isArray(itemsRes.rows) ? (itemsRes.rows as Row[]) : [];
      if (itemRows.length === 0) {
        this.logger.warn({
          msg: 'Auto-invoice: order has no line items — nothing to invoice, skipped',
          orderId,
        });
        return;
      }

      const items: InvoiceItem[] = itemRows.map((r) => ({
        name: String(r.description ?? ''),
        quantity: Number(r.order_quantity ?? 0),
        unitPrice: Number(r.net_price ?? 0),
        taxRate: AUTO_INVOICE_TAX_RATE_PERCENT,
      }));

      const now = _time.now();
      const dueDate = new Date(now.getTime() + AUTO_INVOICE_DUE_DAYS * MS_PER_DAY);

      // 4) Dispatch through the EXISTING manual command path — the handler
      //    re-validates status + inserts inside one transaction (no dup logic here).
      const command = new CreateInvoiceCommand(
        String(orderId),
        customerName,
        items,
        dueDate,
        `Avto-faktura (VISION-3340 #50): buyurtma holati '${newStatus}' ga o'tganda tizim tomonidan yaratildi.`,
        createdByUserId,
      );
      const result = await this.commandBus.execute<
        CreateInvoiceCommand,
        Result<Record<string, unknown>>
      >(command);

      if (result?.ok) {
        this.logger.log({
          msg: 'Auto-invoice: draft invoice created on billable-status transition',
          orderId,
          newStatus,
          invoiceNumber: result.data?.invoice_number,
          itemCount: items.length,
        });
      } else {
        this.logger.warn({
          msg: 'Auto-invoice: CreateInvoiceCommand rejected',
          orderId,
          newStatus,
          error: result && !result.ok ? result.error?.message : 'unknown',
        });
      }
    } catch (e) {
      this.logger.error({
        msg: 'Auto-invoice: failed on billable-status transition',
        orderId,
        newStatus,
        error: (e as Error)?.message,
      });
    }
  }
}
