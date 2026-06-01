/**
 * @module confirm-advance-payment.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { ISalesOrderRepository, SALES_ORDER_REPO } from '../../domain/repositories/i-sales-order.repo';
import { AdvanceApprovedEvent } from '@modules/finance/domain/events/advance-approved.event';

export class ConfirmAdvancePaymentCommand {
  constructor(
    public readonly orderId: number,
    public readonly amount: number,
    public readonly idempotencyKey: string,
  ) {}
}

export interface ConfirmAdvancePaymentResult {
  advancePaid: number;
  advanceStatus: string;
  newVersion: number;
  alreadyApplied: boolean;
}

@CommandHandler(ConfirmAdvancePaymentCommand)
export class ConfirmAdvancePaymentHandler implements ICommandHandler<ConfirmAdvancePaymentCommand> {
  private readonly logger = new Logger(ConfirmAdvancePaymentHandler.name);

  constructor(
    @Inject(SALES_ORDER_REPO) private readonly orderRepo: ISalesOrderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ConfirmAdvancePaymentCommand): Promise<Result<ConfirmAdvancePaymentResult>> {
    if (command.amount <= 0) {
      return Err(AppErr('VALIDATION', 'To\'lov summasi musbat bo\'lishi kerak'));
    }
    if (!command.idempotencyKey) {
      return Err(AppErr('VALIDATION', 'idempotencyKey majburiy'));
    }

    const orderResult = await this.orderRepo.findById(command.orderId);
    if (!orderResult.ok || !orderResult.data) {
      return Err(AppErr('NOT_FOUND', 'Buyurtma topilmadi'));
    }

    const order = orderResult.data;
    const expectedVersion = order.getVersion();
    const persistedAdvancePaid = order.getAdvancePaid();
    const persistedAdvanceStatus = order.getAdvanceStatus();

    const confirmResult = order.confirmAdvancePayment(command.amount, command.idempotencyKey);
    if (!confirmResult.ok) {
      const errMsg = confirmResult.error?.message ?? 'Avans tasdiqlashda xato';
      const isDuplicate = typeof errMsg === 'string' && errMsg.toLowerCase().includes('duplicate');
      return Err(AppErr(isDuplicate ? 'CONFLICT' : 'VALIDATION', errMsg));
    }

    const atomicResult = await this.orderRepo.updateAdvancePaidAtomic(
      command.orderId,
      order.getAdvancePaid(),
      order.getAdvanceStatus(),
      expectedVersion,
      command.idempotencyKey,
    );

    if (!atomicResult.ok) {
      this.logger.warn({
        msg: 'Atomic advance payment update failed — version conflict',
        orderId: command.orderId,
        idempotencyKey: command.idempotencyKey,
        expectedVersion,
        error: atomicResult.error?.message,
      });
      return Err(AppErr('CONFLICT', atomicResult.error?.message ?? 'Bir vaqtda yangilash konflikti: versiya mos kelmadi'));
    }

    if (atomicResult.data.duplicate) {
      this.logger.log({
        msg: 'Idempotent: advance payment already applied (duplicate key) — reloading from DB',
        orderId: command.orderId,
        idempotencyKey: command.idempotencyKey,
      });
      const freshResult = await this.orderRepo.findById(command.orderId);
      const freshOrder = freshResult.ok && freshResult.data ? freshResult.data : null;
      return Ok({
        advancePaid: freshOrder ? freshOrder.getAdvancePaid() : persistedAdvancePaid,
        advanceStatus: freshOrder ? freshOrder.getAdvanceStatus() : persistedAdvanceStatus,
        newVersion: freshOrder ? freshOrder.getVersion() : expectedVersion,
        alreadyApplied: true,
      });
    }

    this.logger.log({
      msg: 'Advance payment confirmed atomically',
      orderId: command.orderId,
      amount: command.amount,
      idempotencyKey: command.idempotencyKey,
      newVersion: atomicResult.data.newVersion,
      timestamp: _time.now().toISOString(),
    });

    // Phase 4 fan-out trigger: when the advance crosses to 'approved' (>=70% paid),
    // publish AdvanceApprovedEvent. EventBridgeService re-emits it to EventEmitter2 under
    // ERP_EVENTS.ADVANCE_APPROVED, which the department fan-out orchestrator consumes.
    // Fires ONCE — only on the pending/partial -> approved transition (the duplicate/idempotent
    // path returns earlier, so this never double-fires).
    if (persistedAdvanceStatus !== 'approved' && order.getAdvanceStatus() === 'approved') {
      const total = order.getTotalAmount();
      const advancePct = total > 0 ? Math.round((order.getAdvancePaid() / total) * 100) : 0;
      this.eventBus.publish(new AdvanceApprovedEvent(command.orderId, order.getAdvancePaid(), advancePct));
      this.logger.log({ msg: 'AdvanceApprovedEvent published (advance >=70% — Phase 4 fan-out trigger)', orderId: command.orderId, advancePct });
    }

    return Ok({
      advancePaid: order.getAdvancePaid(),
      advanceStatus: order.getAdvanceStatus(),
      newVersion: atomicResult.data.newVersion,
      alreadyApplied: false,
    });
  }
}
