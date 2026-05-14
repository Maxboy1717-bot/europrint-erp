/**
 * @module delivery-completed.listener
 * @description Source module. See exports for details.
 */

import { FINANCE_REPO } from '../../domain/repositories/i-finance.repo';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FinanceRepository } from '../repositories/drizzle-finance.repo';

export interface DeliveryCompletedEvent {
  deliveryId: number;
  orderId: number;
  customerId: number;
  deliveryDate: Date;
}

@Injectable()
export class DeliveryCompletedListener {
  private readonly logger = new Logger(DeliveryCompletedListener.name);

  constructor(@Inject(FINANCE_REPO) private readonly financeRepo: FinanceRepository) {}

  @OnEvent('DELIVERY_COMPLETED', { async: true })
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
      this.logger.error(`Error processing DELIVERY_COMPLETED event: ${(error as Error).message}`);
    }
  }
}
