/**
 * @module qc-customer-fault-sd.listener
 * @description Owner decision 2026-07-13 (chat): a QC defect marked "customer fault"
 *   auto-notifies the sales manager who owns the linked order's customer.
 *
 *   Mirrors the exact join-chain shape of qc-failed-sd.listener.ts (QcFailedEvent ->
 *   production_orders.sales_order_id) one hop further, from the QC defect through to
 *   the customer's assigned manager:
 *     qc_defects.inspection_id (set on QcDefectCustomerFaultEvent, carried straight
 *       from the defect row — no re-query needed)
 *     -> qc_inspections.id -> qc_inspections.order_id
 *       (= production_orders.id; confirmed live: qc_inspections.order_id is INTEGER,
 *        same "order_id = production_orders.id" contract documented in
 *        pp/infrastructure/event-handlers/qc-rework.listener.ts and reused verbatim
 *        by qc-failed-sd.listener.ts)
 *     -> production_orders.sales_order_id -> sales_orders.customer_id
 *     -> sd_customers.manager_id (references employees.id — confirmed live via the
 *        same join sd-payments.repository.ts already uses for "collection
 *        responsibility": `LEFT JOIN employees m ON m.id = c.manager_id`, SB0596)
 *     -> employees.user_id -> users.id (notification recipient; notifications.user_id
 *        has no FK but every other in-app notification write targets users.id).
 *
 *   Any missing hop (no inspection linked, no sales order, customer has no manager, or
 *   the manager has no linked user account) is a no-op — Q-40, never fabricate a
 *   recipient. Dispatches through the existing CreateNotificationCommand pipeline
 *   (create-notification.handler.ts) via CommandBus — the same cross-module
 *   CommandBus.execute() call already proven by mm-reconciliation-digest.cron.ts /
 *   cashier-cash-limit-alert.cron.ts (no NotificationsModule import needed; Nest's CQRS
 *   ExplorerService discovers @CommandHandler providers app-wide).
 */

import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { QcDefectCustomerFaultEvent } from '@modules/qc/domain/events';
import { CreateNotificationCommand } from '@modules/notifications/application/commands/create-notification.command';

interface SalesManagerRow {
  sales_order_id: number;
  order_number: string | null;
  manager_user_id: number | null;
}

@Injectable()
@EventsHandler(QcDefectCustomerFaultEvent)
export class QcCustomerFaultSdListener implements IEventHandler<QcDefectCustomerFaultEvent> {
  private readonly logger = new Logger(QcCustomerFaultSdListener.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: QcDefectCustomerFaultEvent): Promise<void> {
    const { defectId, inspectionId, defectCode, markedBy } = event;

    if (!inspectionId) {
      this.logger.log({
        msg: 'QcDefectCustomerFaultEvent: defect has no linked inspection — skipping (idempotent no-op)',
        defectId,
      });
      return;
    }

    try {
      const found = await runQuery<SalesManagerRow>(sql`
        SELECT so.id AS sales_order_id, so.order_number, e.user_id AS manager_user_id
        FROM qc_inspections qi
        JOIN production_orders po ON po.id = qi.order_id
        JOIN sales_orders so ON so.id = po.sales_order_id
        JOIN sd_customers c ON c.id = so.customer_id
        LEFT JOIN employees e ON e.id = c.manager_id
        WHERE qi.id = ${inspectionId}
      `);
      const row = found.rows[0];
      if (!row) {
        this.logger.log({
          msg: 'QcDefectCustomerFaultEvent: inspection has no linked sales order — skipping (idempotent no-op)',
          defectId, inspectionId,
        });
        return;
      }
      if (!row.manager_user_id) {
        this.logger.log({
          msg: 'QcDefectCustomerFaultEvent: order customer has no assigned manager (or manager has no linked user account) — skipping (Q-40, no fabricated recipient)',
          defectId, inspectionId, salesOrderId: row.sales_order_id,
        });
        return;
      }

      const orderLabel = row.order_number ?? `#${row.sales_order_id}`;
      const title = "QC nuqson: mijoz aybi";
      const body = `Buyurtma ${orderLabel} bo'yicha QC nuqson (${defectCode || 'kodlanmagan'}) mijoz aybi deb belgilandi (belgilagan: ${markedBy}).`;

      await this.commandBus.execute(
        new CreateNotificationCommand(
          String(row.manager_user_id),
          title,
          body,
          'qc_customer_fault',
          String(row.sales_order_id),
          'sales_order',
        ),
      );

      this.logger.log({
        msg: 'Customer-fault QC defect notified to sales manager',
        defectId, inspectionId, salesOrderId: row.sales_order_id, managerUserId: row.manager_user_id,
      });
    } catch (error: unknown) {
      this.logger.error({
        msg: 'Failed to notify sales manager for customer-fault QC defect',
        defectId, inspectionId,
        error: (error as Error).message,
      });
    }
  }
}
