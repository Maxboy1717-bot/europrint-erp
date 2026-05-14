/**
 * @module create-invoice.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Result, Ok } from '@common/result';
import { CreateInvoiceCommand } from './create-invoice.command';
import { db, runQuery } from '@shared/db';
import { invoices } from '@shared/db';
import { sql } from 'drizzle-orm';

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
      ) {}

  async execute(command: CreateInvoiceCommand): Promise<Result<Record<string, unknown>>> {
      // Buyurtma holati tekshiruvi — draft holatida faktura yaratish mumkin emas
      if (command.salesOrderId) {
        const orderRows = await runQuery<{ status: string; deleted_at: unknown }>(sql`
          SELECT status, deleted_at FROM sales_orders WHERE id = ${command.salesOrderId} LIMIT 1
        `);
        const order = orderRows.rows[0];
        if (!order) throw new BadRequestException(`Buyurtma #${command.salesOrderId} topilmadi`);
        if (order.deleted_at) throw new BadRequestException('Bekor qilingan buyurtma uchun faktura yaratib bo\'lmaydi');
        if (!INVOICEABLE_STATUSES.has(String(order.status))) {
          throw new BadRequestException(
            `Buyurtma holati "${order.status}" da faktura yaratib bo'lmaydi. ` +
            `Avval buyurtmani tasdiqlating (approved yoki undan keyin).`
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

      const result = await db.insert(invoices).values({
        invoice_number: invoiceNumber,
        sales_order_id: command.salesOrderId,
        customer_name: command.customerName,
        customer_id: undefined,
        items: JSON.stringify(command.items),
        subtotal: subtotal.toString(),
        tax_amount: taxAmount.toString(),
        total_amount: totalAmount.toString(),
        paid_amount: '0',
        status: 'draft',
        due_date: command.dueDate,
        created_by: command.userId,
        created_at: _time.now(),
        updated_at: _time.now(),
      });

      this.logger.log('Invoice created');

      return Ok({
        invoice_number: invoiceNumber,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'draft',
      });
  }
}
