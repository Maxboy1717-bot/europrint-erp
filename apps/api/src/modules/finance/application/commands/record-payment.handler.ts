import { FINANCE_REPO } from '../../domain/repositories/i-finance.repo';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Invoice } from '../../domain/aggregates/invoice.aggregate';
import { FinanceRepository } from '../../infrastructure/repositories/drizzle-finance.repo';
import { GlPostingService } from '../../domain/services/gl-posting.service';
import { AppErr, Err, Ok, Result, isErr } from '@common/result';

export class RecordPaymentCommand {
  private readonly logger = new Logger(RecordPaymentCommand.name);

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
    private eventEmitter: EventEmitter2
  ) {}

  async execute(command: RecordPaymentCommand): Promise<Result<number>> {
      this.logger.debug(
        `Recording payment - Payment ID: ${command.paymentId}, Amount: ${command.amount}`
      );

      const invoiceResult = await this.financeRepo.findInvoiceById(String(command.invoiceId));

      if (!invoiceResult.ok || !invoiceResult.data) {
        return Err(AppErr('NOT_FOUND', 'Invoice not found'));
      }

      const raw = invoiceResult.data;
      const invoice = Invoice.create({
        id:            raw['id'] as number,
        customerId:    raw['customerId'] as number,
        invoiceNumber: raw['invoiceNumber'] as string,
        status:        raw['status'] as import('../../domain/aggregates/invoice.aggregate').InvoiceProps['status'],
        totalAmount:   raw['totalAmount'] as number,
        paidAmount:    raw['paidAmount'] as number,
        dueDate:       raw['dueDate'] as Date,
        createdAt:     raw['createdAt'] as Date,
      });

      if (command.amount + invoice.paidAmount >= invoice.totalAmount) {
        const finalAmount = command.amount + invoice.paidAmount;
        invoice.markAsFullyPaid(finalAmount);

        const glResult = await this.glPostingService.postCustomerPayment(
          command.paymentId,
          command.amount
        );

        if (isErr(glResult)) {
          return Err(`GL posting failed: ${glResult.error.message}`);
        }

        await this.financeRepo.recordPayment({
          paymentId: command.paymentId,
          invoiceId: command.invoiceId,
          amount: command.amount,
          status: 'recorded',
          recordedBy: command.recordedBy,
          recordedAt: command.paymentDate,
        });

        const events = invoice.getDomainEvents();
        for (const event of events) {
          this.eventEmitter.emit(event.eventName, event);
        }

        this.logger.log(
          `Payment recorded and invoice fully paid - Payment ID: ${command.paymentId}`
        );

        return Ok(command.paymentId);
      }

      invoice.markAsPartiallyPaid(command.amount);

      const glResult2 = await this.glPostingService.postCustomerPayment(
        command.paymentId,
        command.amount
      );

      if (isErr(glResult2)) {
        return Err(`GL posting failed: ${glResult2.error.message}`);
      }

      await this.financeRepo.recordPayment({
        paymentId: command.paymentId,
        invoiceId: command.invoiceId,
        amount: command.amount,
        status: 'recorded',
        recordedBy: command.recordedBy,
        recordedAt: command.paymentDate,
      });

      const events = invoice.getDomainEvents();
      for (const event of events) {
        this.eventEmitter.emit(event.eventName, event);
      }

      this.logger.log(
        `Payment recorded - Payment ID: ${command.paymentId}, Remaining: ${invoice.remainingAmount}`
      );

      return Ok(command.paymentId);
  }
}
