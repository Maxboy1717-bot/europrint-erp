import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok } from '@common/result';
import { CreateInvoiceCommand } from './create-invoice.command';
import { db } from '@shared/db';
import { invoices } from '@shared/db';

@Injectable()
@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler implements ICommandHandler<CreateInvoiceCommand> {
  private readonly logger = new Logger(CreateInvoiceHandler.name);

  constructor(
    private readonly eventBus: EventBus,
      ) {}

  async execute(command: CreateInvoiceCommand): Promise<Result<Record<string, unknown>>> {
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
