/**
 * @module record-payment.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { FINANCE_REPO } from '../../domain/repositories/i-finance.repo';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Invoice } from '../../domain/aggregates/invoice.aggregate';
import { FinanceRepository } from '../../infrastructure/repositories/drizzle-finance.repo';
import { GlPostingService } from '../../domain/services/gl-posting.service';
import { AppErr, Err, Ok, Result, isErr } from '@common/result';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';
import { InvoiceFullyPaidEvent } from '../../domain/events/invoice-fully-paid.event';
import { InvoicePartiallyPaidEvent } from '../../domain/events/invoice-partially-paid.event';

export class RecordPaymentCommand {
  constructor(public readonly paymentId: number,
    public readonly invoiceId: number,
    public readonly customerId: number,
    public readonly amount: number,
    public readonly paymentDate: Date,
    public readonly recordedBy: number) {}
}

@CommandHandler(RecordPaymentCommand)
export class RecordPaymentHandler implements ICommandHandler<RecordPaymentCommand> {
  private logger = new Logger('RecordPaymentHandler');

  constructor(
    @Inject(FINANCE_REPO)
    private readonly financeRepo: FinanceRepository,
    private glPostingService: GlPostingService,
    private eventEmitter: EventEmitter2,
    private eventBus: EventBus,
  ) {}

  async execute(command: RecordPaymentCommand): Promise<Result<number>> {
      this.logger.debug(
        `Recording payment - Payment ID: ${command.paymentId}, Amount: ${command.amount}`
      );

      const invoiceResult = await this.financeRepo.findInvoiceById(String(command.invoiceId));

      if (!invoiceResult.ok || !invoiceResult.data) {
        return Err(AppErr('NOT_FOUND', 'Invoice not found'));
      }

      // Map raw snake_case DB row to camelCase to avoid NaN arithmetic.
      // finance_invoices uses `payment_status` column (not `status`).
      const raw = invoiceResult.data;
      const invoiceData = {
        id:            raw['id'] as number,
        totalAmount:   parseFloat(String(raw['total_amount'] ?? raw['totalAmount'] ?? '0')),
        paidAmount:    parseFloat(String(raw['paid_amount'] ?? raw['paidAmount'] ?? '0')),
        dueDate:       (raw['due_date'] ?? raw['dueDate']) as Date,
        invoiceNumber: String(raw['invoice_number'] ?? raw['invoiceNumber'] ?? raw['id']),
        customerId:    (raw['customer_id'] ?? raw['customerId']) as number,
        status:        (raw['payment_status'] ?? raw['status']) as import('../../domain/aggregates/invoice.aggregate').InvoiceProps['status'],
        createdAt:     (raw['created_at'] ?? raw['createdAt']) as Date,
      };
      const invoice = Invoice.create(invoiceData);

      const commandAmountCents  = Math.round(command.amount * 100);
      const paidAmountCents     = Math.round(invoice.paidAmount * 100);
      const totalAmountCents    = Math.round(invoice.totalAmount * 100);
      const remainingCents      = totalAmountCents - paidAmountCents;
      const finalAmountCents    = commandAmountCents + paidAmountCents;

      // Overpayment guard
      if (commandAmountCents > remainingCents) {
        return Err('Ortiqcha to\'lov ruxsat etilmaydi');
      }

      const paymentStatus = finalAmountCents >= totalAmountCents ? 'completed' : 'partial';

      if (finalAmountCents >= totalAmountCents) {
        const finalAmount = finalAmountCents / 100;
        const fullPayR = invoice.markAsFullyPaid(finalAmount);
        if (!fullPayR.ok) return Err(fullPayR.error.message);

        await this.financeRepo.recordPayment({
          paymentId: command.paymentId,
          invoiceId: command.invoiceId,
          amount: command.amount,
          status: paymentStatus,
          recordedBy: command.recordedBy,
          recordedAt: command.paymentDate,
        });

        // Sync finance_invoices.paid_amount + payment_status after recording payment.
        await this.financeRepo.updateInvoicePaidAmount(
          command.invoiceId,
          invoice.paidAmount,
          'paid',
        );

        const glResult = await this.glPostingService.postCustomerPayment(
          command.paymentId,
          command.amount
        );

        if (isErr(glResult)) {
          return Err(`GL posting failed: ${glResult.error.message}`);
        }

        const events = invoice.getDomainEvents();
        for (const event of events) {
          // PA2-18 Wave 4 round-3: dual emit — CQRS bus for canonical
          // @EventsHandler consumers (e.g. PaymentReceivedListener), plus the
          // legacy string topic for any non-migrated EventEmitter2 consumer.
          this.eventBus.publish(event);
          if (event instanceof InvoiceFullyPaidEvent) {
            this.eventEmitter.emit(ERP_EVENTS.INVOICE_FULLY_PAID, event);
          } else if (event instanceof InvoicePartiallyPaidEvent) {
            this.eventEmitter.emit(ERP_EVENTS.PAYMENT_FULL, event);
          } else {
            this.eventEmitter.emit(event.eventName, event);
          }
        }

        this.logger.log(
          `Payment recorded and invoice fully paid - Payment ID: ${command.paymentId}`
        );

        return Ok(command.paymentId);
      }

      const partialR = invoice.markAsPartiallyPaid(command.amount);
      if (!partialR.ok) return Err(partialR.error.message);

      await this.financeRepo.recordPayment({
        paymentId: command.paymentId,
        invoiceId: command.invoiceId,
        amount: command.amount,
        status: paymentStatus,
        recordedBy: command.recordedBy,
        recordedAt: command.paymentDate,
      });

      // Sync finance_invoices.paid_amount + payment_status after partial payment.
      await this.financeRepo.updateInvoicePaidAmount(
        command.invoiceId,
        invoice.paidAmount,
        'partial',
      );

      const glResult2 = await this.glPostingService.postCustomerPayment(
        command.paymentId,
        command.amount
      );

      if (isErr(glResult2)) {
        return Err(`GL posting failed: ${glResult2.error.message}`);
      }

      const events = invoice.getDomainEvents();
      for (const event of events) {
        if (event instanceof InvoiceFullyPaidEvent) {
          this.eventEmitter.emit(ERP_EVENTS.INVOICE_FULLY_PAID, event);
        } else if (event instanceof InvoicePartiallyPaidEvent) {
          this.eventEmitter.emit(ERP_EVENTS.PAYMENT_FULL, event);
        } else {
          this.eventEmitter.emit(event.eventName, event);
        }
      }

      this.logger.log(
        `Payment recorded - Payment ID: ${command.paymentId}, Remaining: ${invoice.remainingAmount}`
      );

      return Ok(command.paymentId);
  }
}
