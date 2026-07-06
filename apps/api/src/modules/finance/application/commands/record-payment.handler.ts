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
import { db } from '@shared/db';

export class RecordPaymentCommand {
  constructor(public readonly paymentId: number,
    public readonly invoiceId: number,
    public readonly customerId: number,
    public readonly amount: number,
    public readonly paymentDate: Date,
    public readonly recordedBy: number,
    /** C1: optional client-supplied idempotency key — a retry with the same key is a no-op replay. */
    public readonly idempotencyKey: string | null = null) {}
}

const OVERPAY_SENTINEL = 'C1_OVERPAY_RACE';

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

    // C1 idempotency fast-path: a retry of an already-recorded payment is a no-op replay, not an
    // error. This is a best-effort pre-check (closed race-free by the UNIQUE index + in-tx catch
    // below — two concurrent identical retries can both reach past this check).
    if (command.idempotencyKey) {
      const existingR = await this.financeRepo.findPaymentByIdempotencyKey(command.idempotencyKey);
      if (existingR.ok && existingR.data) {
        this.logger.debug(`Idempotent replay - key=${command.idempotencyKey}, existing paymentId=${existingR.data.id}`);
        return Ok(existingR.data.id);
      }
    }

    const invoiceResult = await this.financeRepo.findInvoiceById(String(command.invoiceId));
    if (!invoiceResult.ok || !invoiceResult.data) {
      return Err(AppErr('NOT_FOUND', 'Invoice not found'));
    }

    // Map raw snake_case DB row to camelCase to avoid NaN arithmetic.
    // finance_invoices uses `payment_status` column (not `status`).
    const raw = invoiceResult.data;
    const totalAmount    = parseFloat(String(raw['total_amount'] ?? raw['totalAmount'] ?? '0'));
    const paidAmountRead  = parseFloat(String(raw['paid_amount'] ?? raw['paidAmount'] ?? '0'));
    const invoiceNumber  = String(raw['invoice_number'] ?? raw['invoiceNumber'] ?? raw['id']);
    const customerId     = (raw['customer_id'] ?? raw['customerId']) as number;
    const statusRead     = (raw['payment_status'] ?? raw['status']) as import('../../domain/aggregates/invoice.aggregate').InvoiceProps['status'];
    const dueDate        = (raw['due_date'] ?? raw['dueDate']) as Date;
    const createdAt      = (raw['created_at'] ?? raw['createdAt']) as Date;

    // Fast, non-authoritative pre-check (defense-in-depth / early rejection so an obviously-bad
    // request doesn't even reach the DB). This snapshot can be stale under concurrency — the
    // AUTHORITATIVE guard is the atomic UPDATE inside the transaction below, which re-evaluates
    // against the row as committed at that instant and is what actually closes the race
    // (C1, CRITICAL-CORRECTNESS-AUDIT-2026-07-06: record-payment double-spend/lost-update).
    if (Math.round(command.amount * 100) > Math.round((totalAmount - paidAmountRead) * 100)) {
      return Err('Ortiqcha to\'lov ruxsat etilmaydi');
    }

    // C1: payment INSERT + invoice atomic guarded UPDATE commit together, or neither does.
    // Postgres row-level locking on the UPDATE serializes concurrent payments against the SAME
    // invoice row — the second concurrent request blocks until the first commits, then
    // re-evaluates its own guard against the now-updated balance. This is what makes the overpay
    // guard race-proof (the pre-check above cannot be, since it reads before either tx starts).
    let outcome: { paymentId: number; newPaidAmount: number; paymentStatus: 'paid' | 'partial' };
    try {
      outcome = await db.transaction(async (tx) => {
        const updR = await this.financeRepo.applyInvoicePayment(command.invoiceId, command.amount, tx);
        if (!updR.ok) throw new Error(updR.error.message);
        if (!updR.data) throw new Error(OVERPAY_SENTINEL);

        const paymentStatusCode = updR.data.paymentStatus === 'paid' ? 'completed' : 'partial';
        const paymentR = await this.financeRepo.recordPayment({
          paymentId: command.paymentId,
          invoiceId: command.invoiceId,
          amount: command.amount,
          status: paymentStatusCode,
          recordedBy: command.recordedBy,
          recordedAt: command.paymentDate,
          idempotencyKey: command.idempotencyKey,
        }, tx);
        if (!paymentR.ok) throw new Error(paymentR.error.message);

        return {
          paymentId: paymentR.data.id,
          newPaidAmount: updR.data.paidAmount,
          paymentStatus: updR.data.paymentStatus,
        };
      });
    } catch (err) {
      const message = (err as Error)?.message ?? 'Transaction failed';
      if (message === OVERPAY_SENTINEL) {
        return Err('Ortiqcha to\'lov ruxsat etilmaydi');
      }
      // Race: two concurrent identical retries both passed the pre-check SELECT above; the
      // second's INSERT hits the UNIQUE(idempotency_key) constraint. Mirrors the accepted
      // pos-movement.service.ts pattern — return the winner's row instead of a false error.
      if (command.idempotencyKey && /idempotency_key|unique/i.test(message)) {
        const raceR = await this.financeRepo.findPaymentByIdempotencyKey(command.idempotencyKey);
        if (raceR.ok && raceR.data) return Ok(raceR.data.id);
      }
      this.logger.error({ msg: 'Payment transaction rolled back', error: message });
      return Err(message);
    }

    // GL posting happens AFTER the payment+invoice tx commits — GlPostingService opens its OWN
    // internal transaction (insertJournal wraps `db.transaction` itself) and cannot join an
    // external one, the same accepted tradeoff already documented for payroll (F3, b42ab33f) and
    // SD invoices. Posting here (not before) means a GL failure can never produce an orphaned "GL
    // says paid, nothing recorded" row — the exact garbage-row class F1 already purged. If GL
    // fails, we explicitly compensate (delete the payment row + reverse the invoice amount) so the
    // net observable effect matches "GL failure rolls back the payment+invoice rows too", even
    // though it is a compensating transaction rather than one shared engine transaction.
    const glResult = await this.glPostingService.postCustomerPayment(outcome.paymentId, command.amount);
    if (isErr(glResult)) {
      const compR = await this.financeRepo.reverseInvoicePayment(outcome.paymentId, command.invoiceId, command.amount);
      if (!compR.ok) {
        this.logger.error({
          msg: 'CRITICAL: GL post failed AND compensation failed — payment+invoice left inconsistent',
          paymentId: outcome.paymentId, invoiceId: command.invoiceId, compensationError: compR.error.message,
        });
      }
      return Err(`GL posting failed: ${glResult.error.message}`);
    }

    // Domain events: hydrate a fresh aggregate from the ACTUAL committed pre-payment state
    // (newPaidAmount - command.amount), not the stale snapshot read before the transaction, so
    // invariant checks and event payloads reflect committed truth rather than a guess.
    const invoice = Invoice.create({
      id: command.invoiceId,
      customerId,
      invoiceNumber,
      status: statusRead,
      totalAmount,
      paidAmount: outcome.newPaidAmount - command.amount,
      dueDate,
      createdAt,
    });
    const mark = outcome.paymentStatus === 'paid'
      ? invoice.markAsFullyPaid(outcome.newPaidAmount)
      : invoice.markAsPartiallyPaid(command.amount);
    if (!mark.ok) {
      // Unreachable in practice — the atomic UPDATE already proved these amounts are consistent.
      // Payment + GL are already committed; only the domain-event side effect is skipped.
      this.logger.error({ msg: 'Domain event construction failed post-commit (non-fatal)', error: mark.error.message });
    } else {
      for (const event of invoice.getDomainEvents()) {
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
    }

    this.logger.log(
      `Payment recorded - Payment ID: ${outcome.paymentId}, Status: ${outcome.paymentStatus}`
    );
    return Ok(outcome.paymentId);
  }
}
