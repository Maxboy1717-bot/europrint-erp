/**
 * @module create-invoice.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import { CreateInvoiceCommand } from './create-invoice.command';
import { ISdInvoicesRepository, SD_INVOICES_REPO } from '../../invoices/i-sd-invoices.repo';

// Faktura yaratishga ruxsat berilgan buyurtma holatlari
const INVOICEABLE_STATUSES = new Set([
  'approved', 'pending_advance', 'ready_for_planning',
  'in_planning', 'completed_planning', 'ready_for_production',
  'in_production', 'ready_for_shipment', 'shipped', 'delivered',
]);

@Injectable()
@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler implements ICommandHandler<CreateInvoiceCommand> {
  private readonly logger = new Logger(CreateInvoiceHandler.name);

  constructor(
    private readonly eventBus: EventBus,
    @Inject(SD_INVOICES_REPO) private readonly invoicesRepo: ISdInvoicesRepository,
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<Result<Record<string, unknown>>> {
    // Validatsiya va INSERT bir tranzaksiya ichida — read-then-write race yo'q
    const outcome = await this.invoicesRepo.withTransaction(async (tx) => {
      // VISION-3340 SD-06 #24 — 'full' | 'partial' | null (buyurtma bog'lanmagan yoki hali
      // yetkazish ma'lumoti yo'q holatda fabrikatsiya qilinmaydi, NULL qoladi — Q-40).
      let invoiceType: 'full' | 'partial' | null = null;
      // Buyurtma holati tekshiruvi — draft holatida faktura yaratish mumkin emas
      if (command.salesOrderId) {
        const orderResult = await this.invoicesRepo.findOrderForInvoicing(command.salesOrderId, tx);
        if (!orderResult.ok) {
          return Err(orderResult.error);
        }
        const order = orderResult.data;
        if (!order) {
          return Err(AppErr('BAD_REQUEST', `Buyurtma #${command.salesOrderId} topilmadi`));
        }
        if (order.deletedAt) {
          return Err(AppErr('BAD_REQUEST', "Bekor qilingan buyurtma uchun faktura yaratib bo'lmaydi"));
        }
        if (!INVOICEABLE_STATUSES.has(String(order.status))) {
          return Err(
            AppErr(
              'BAD_REQUEST',
              `Buyurtma holati "${order.status}" da faktura yaratib bo'lmaydi. ` +
                `Avval buyurtmani tasdiqlating (approved yoki undan keyin).`,
            ),
          );
        }

        // VISION-3340 SD-06 #24 — invoice_type: yetkazilgan miqdor (delivery_items, deliveries
        // orqali) buyurtma miqdoridan (sales_order_items.order_quantity) kam bo'lsa 'partial',
        // aks holda 'full'. Yetkazish ma'lumoti hali yo'q bo'lsa (hasDeliveryData=false — masalan
        // build-fazasi bo'sh delivery_items) yoki so'rov muvaffaqiyatsiz bo'lsa hech narsa
        // fabrikatsiya qilinmaydi — invoiceType NULL qoladi, faktura yaratilishi to'xtamaydi.
        const fulfillmentResult = await this.invoicesRepo.getOrderFulfillmentQty(
          command.salesOrderId,
          tx,
        );
        if (fulfillmentResult.ok) {
          const { orderedQty, deliveredQty, hasDeliveryData } = fulfillmentResult.data;
          if (hasDeliveryData && orderedQty > 0) {
            invoiceType = deliveredQty < orderedQty ? 'partial' : 'full';
          }
        } else {
          this.logger.warn(
            `invoice_type aniqlanmadi (buyurtma #${command.salesOrderId}): ${fulfillmentResult.error.message}`,
          );
        }
      }

      let subtotal = 0;
      let taxAmount = 0;

      for (const item of command.items) {
        const itemTotal = item.quantity * item.unitPrice;
        subtotal += itemTotal;
        const itemTax = (itemTotal * item.taxRate) / 100;
        taxAmount += itemTax;
      }

      const totalAmount = subtotal + taxAmount;
      const invoiceNumber = `INV-${Date.now()}`;
      const now = _time.now();

      const insertResult = await this.invoicesRepo.createInvoice(
        {
          invoiceNumber,
          salesOrderId: command.salesOrderId ?? null,
          customerName: command.customerName,
          customerId: null,
          itemsJson: JSON.stringify(command.items),
          subtotal: subtotal.toString(),
          taxAmount: taxAmount.toString(),
          totalAmount: totalAmount.toString(),
          paidAmount: '0',
          status: 'draft',
          dueDate: command.dueDate,
          createdBy: command.userId,
          createdAt: now,
          updatedAt: now,
          deliveryTerm: command.deliveryTerm,
          incotermCode: command.incotermCode,
          currency: command.currency,
          invoiceType,
        },
        tx,
      );

      if (!insertResult.ok) {
        return Err(insertResult.error);
      }

      return Ok({
        invoice_number: insertResult.data.invoiceNumber,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: insertResult.data.status,
      });
    });

    if (!outcome.ok) {
      return Err(outcome.error);
    }
    if (!outcome.data) {
      return Err(AppErr('INTERNAL', 'Invoice transaction returned no data'));
    }
    this.logger.log('Invoice created');
    return Ok(outcome.data);
  }
}
