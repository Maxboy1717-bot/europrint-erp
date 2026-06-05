/**
 * @module goods-receipt.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { Ok, Err } from '@common/result';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IMmRepository, MM_REPO } from '../../domain/repositories/mm.repository';
import { ThreeWayMatchFailedEvent } from '../../domain/events/three-way-match-failed.event';

export class GoodsReceiptCommand {
  constructor(public poId: number,
    public quantity: number,
    public invoiceQuantity: number) {}
}

@CommandHandler(GoodsReceiptCommand)
export class GoodsReceiptHandler implements ICommandHandler<GoodsReceiptCommand> {
  private readonly logger = new Logger(GoodsReceiptHandler.name);
  constructor(
    @Inject(MM_REPO) private mmRepo: IMmRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: GoodsReceiptCommand): Promise<Result<void>> {
    this.logger.log('Recording goods receipt');

    // PO read + 3-way match + status save atomically — partial failures roll back.
    const outcome = await this.mmRepo.withTransaction(async (tx) => {
      const poResult = await this.mmRepo.getPurchaseOrder(command.poId, tx);
      if (!poResult.ok) {
        return Err(poResult.error);
      }

      const po = poResult.data;

      // §17 3-Way Match: PO + GR + Invoice
      const matchResult = await this.mmRepo.validateThreeWayMatch(command.poId, tx);
      if (!matchResult.ok) {
        return Err(matchResult.error);
      }

      if (!matchResult.data.matched) {
        this.logger.warn(
          { poId: command.poId, difference: matchResult.data.difference },
          'Three-way match failed - Purchase manager approval required',
        );

        // Buffer the event payload; emit only after rollback so consumers see consistent state.
        return Err(
          `THREE_WAY_MATCH_FAILED|${command.poId}|${matchResult.data.difference}`,
        );
      }

      const receiptResult = po.recordGoodsReceipt(command.quantity);
      if (!receiptResult.ok) {
        return Err(receiptResult.error);
      }

      const saveResult = await this.mmRepo.savePurchaseOrder(po, tx);
      if (!saveResult.ok) {
        return Err(saveResult.error);
      }

      return Ok(undefined);
    });

    if (!outcome.ok) {
      // Decode buffered 3-way-match-fail signal back into the original event + message.
      const errMsg = outcome.error?.message ?? '';
      if (errMsg.startsWith('THREE_WAY_MATCH_FAILED|')) {
        const [, poId, difference] = errMsg.split('|');
        this.eventBus.publish(new ThreeWayMatchFailedEvent(Number(poId), Number(difference)));
        return Err(`Farq: ${difference}. Xarid menejer tasdiqlashi kerak`);
      }
      return Err(outcome.error);
    }

    this.logger.log('Goods receipt recorded');
    return Ok(undefined);
  }
}
