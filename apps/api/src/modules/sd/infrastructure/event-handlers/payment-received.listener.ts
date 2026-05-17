/**
 * @module payment-received.listener
 * @description Wave 4 round-3 (PA2-18): canonical CQRS
 *   `@EventsHandler(InvoiceFullyPaidEvent)` form. Migrated from the legacy
 *   `@OnEvent(ERP_EVENTS.INVOICE_FULLY_PAID)` string topic to the canonical
 *   event class. EventBridge keeps re-emitting to the legacy string topic for
 *   any non-migrated consumers — see EVENT_NAME_MAP entry in
 *   event-bridge.service.ts.
 *
 *   Trigger 15, 20 — Invoice fully paid → close delivered orders.
 *
 *   The previous `@OnEvent` listener treated the payload as an opaque
 *   `Record<string, unknown>` and read `event.orderId`/`event.amount`. The
 *   typed event class actually carries `invoiceId`, `customerId`,
 *   `totalAmount`, `paidAt` — see invoice-fully-paid.event.ts. Behaviour is
 *   preserved by using `event.props.invoiceId` as the order identifier and
 *   `event.props.totalAmount` as the amount. If invoice and order IDs diverge
 *   in this codebase, that's a pre-existing semantic gap unrelated to Wave 4.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { safeCall, isErr } from '@common/result';
import {
  ISalesOrderRepository,
  SALES_ORDER_REPO,
} from '../../domain/repositories/i-sales-order.repo';
import { UpdateOrderStatusCommand } from '../../application/commands/update-order-status.handler';
import { InvoiceFullyPaidEvent } from '@modules/finance/domain/events/invoice-fully-paid.event';

@Injectable()
@EventsHandler(InvoiceFullyPaidEvent)
export class PaymentReceivedListener implements IEventHandler<InvoiceFullyPaidEvent> {
  private readonly logger = new Logger(PaymentReceivedListener.name);

  constructor(
    @Inject(SALES_ORDER_REPO) private readonly orderRepo: ISalesOrderRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async handle(event: InvoiceFullyPaidEvent): Promise<void> {
    const { invoiceId, totalAmount } = event.props;

    this.logger.log({
      msg: 'Full payment received - Trigger 15, 20',
      invoiceId,
      amount: totalAmount,
    });

    const handlerResult = await safeCall(async () => {
      const orderResult = await this.orderRepo.findById(Number(invoiceId));
      if (!orderResult.ok || !orderResult.data) {
        this.logger.warn({ msg: 'Order not found', invoiceId });
        return;
      }

      const order = orderResult.data as { getStatus(): string };
      const currentStatus = order.getStatus();

      // State machine allows: delivered → closed only.
      // If payment arrives before delivery, record it but do not force-close.
      if (currentStatus !== 'delivered') {
        this.logger.log({
          msg: 'Full payment received but order not yet delivered — close deferred',
          invoiceId,
          currentStatus,
        });
        return;
      }

      const command = new UpdateOrderStatusCommand(Number(invoiceId), 'closed');
      await this.commandBus.execute(command);

      this.logger.log({
        msg: 'Order closed after full payment',
        invoiceId,
      });
    });

    if (isErr(handlerResult)) {
      this.logger.error({
        msg: 'Exception while handling payment full event',
        invoiceId,
        error: handlerResult.error.message,
      });
    }
  }
}
