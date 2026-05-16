/**
 * @module delivery-completed.listener
 * @description PA2-18: canonical CQRS @EventsHandler form. Listens for
 *   DeliveryCompletedEvent (published by logistics/complete-delivery.handler)
 *   and reconciles the delivered order with its invoice balance. Trigger 14.
 */

import { FINANCE_REPO } from '../../domain/repositories/i-finance.repo';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { FinanceRepository } from '../repositories/drizzle-finance.repo';
import { DeliveryCompletedEvent } from '@modules/logistics/domain/events';

@Injectable()
@EventsHandler(DeliveryCompletedEvent)
export class DeliveryCompletedListener implements IEventHandler<DeliveryCompletedEvent> {
  private readonly logger = new Logger(DeliveryCompletedListener.name);

  constructor(@Inject(FINANCE_REPO) private readonly financeRepo: FinanceRepository) {}

  async handle(event: DeliveryCompletedEvent): Promise<void> {
    try {
      this.logger.debug(
        `Processing delivery completed event - Delivery: ${event.deliveryId}, Order: ${event.orderId}`
      );

      const invoiceResult = await this.financeRepo.findInvoiceById(String(event.orderId));

      if (!invoiceResult.ok || !invoiceResult.data) {
        this.logger.warn(`Invoice not found for order ${event.orderId}`);
        return;
      }

      const invoice = invoiceResult.data;
      const paidAmount = Number(invoice['paidAmount'] ?? invoice['paid_amount'] ?? 0);
      const totalAmount = Number(invoice['totalAmount'] ?? invoice['total_amount'] ?? 0);

      if (paidAmount > 0 && paidAmount < totalAmount) {
        this.logger.log(
          `Delivery completed with outstanding balance - Order: ${event.orderId}, Remaining: ${totalAmount - paidAmount}`
        );
      } else if (paidAmount === 0) {
        this.logger.warn(
          `Delivery completed with no payment received - Order: ${event.orderId}, Amount: ${totalAmount}`
        );
      } else {
        this.logger.log(`Delivery completed and paid in full - Order: ${event.orderId}`);
      }
    } catch (error: unknown) {
      this.logger.error(`Error processing DeliveryCompletedEvent: ${(error as Error).message}`);
    }
  }
}
