/**
 * @module payment-received.listener
 * @description Source module. See exports for details.
 */

import { Err } from '@common/types/result.type';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CommandBus } from '@nestjs/cqrs';
import { safeCall, isErr } from '@common/result';
import { ISalesOrderRepository, SALES_ORDER_REPO } from '../../domain/repositories/i-sales-order.repo';
import { UpdateOrderStatusCommand } from '../../application/commands/update-order-status.handler';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';

@Injectable()
export class PaymentReceivedListener {
  private readonly logger = new Logger(PaymentReceivedListener.name);
  constructor(
    @Inject(SALES_ORDER_REPO) private readonly orderRepo: ISalesOrderRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @OnEvent(ERP_EVENTS.INVOICE_FULLY_PAID, { async: true })
  async handlePaymentFull(event: Record<string, unknown>) {
    this.logger.log({
      msg: 'Full payment received - Trigger 15, 20',
      orderId: event.orderId,
      amount: event.amount,
    });

    const handlerResult = await safeCall(async () => {
      const orderResult = await this.orderRepo.findById(Number(event.orderId));
      if (!orderResult.ok || !orderResult.data) {
        this.logger.warn({ msg: 'Order not found', orderId: event.orderId });
        return;
      }

      const order = orderResult.data as { getStatus(): string };
      const currentStatus = order.getStatus();

      // State machine allows: delivered → closed only.
      // If payment arrives before delivery, record it but do not force-close.
      if (currentStatus !== 'delivered') {
        this.logger.log({
          msg: 'Full payment received but order not yet delivered — close deferred',
          orderId: event.orderId,
          currentStatus,
        });
        return;
      }

      const command = new UpdateOrderStatusCommand(Number(event.orderId), 'closed');
      await this.commandBus.execute(command);

      this.logger.log({
        msg: 'Order closed after full payment',
        orderId: event.orderId,
      });
    });

    if (isErr(handlerResult)) {
      this.logger.error({
        msg: 'Exception while handling payment full event',
        orderId: event.orderId,
        error: handlerResult.error.message,
      });
    }
  }
}
