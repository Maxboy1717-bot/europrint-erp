import { Ok, Err } from '@common/result';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IMmRepository } from '../../domain/repositories/mm.repository';

export class GoodsReceiptCommand {
  constructor(public poId: number,
    public quantity: number,
    public invoiceQuantity: number) {}
}

@CommandHandler(GoodsReceiptCommand)
export class GoodsReceiptHandler implements ICommandHandler<GoodsReceiptCommand> {
  private readonly logger = new Logger(GoodsReceiptHandler.name);
  constructor(
    @Inject('IMmRepository') private mmRepo: IMmRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: GoodsReceiptCommand): Promise<Result<void>> {
    this.logger.log('Recording goods receipt');

    const poResult = await this.mmRepo.getPurchaseOrder(command.poId);
    if (!poResult.ok) {
      return Err(poResult.error);
    }

    const po = poResult.data;

    // §17 3-Way Match: PO + GR + Invoice
    const matchResult = await this.mmRepo.validateThreeWayMatch(command.poId);
    if (!matchResult.ok) {
      return Err(matchResult.error);
    }

    if (!matchResult.data.matched) {
      this.logger.warn(
        { poId: command.poId, difference: matchResult.data.difference },
        'Three-way match failed - Purchase manager approval required',
      );

      this.eventBus.publish('THREE_WAY_MATCH_FAILED', {
        poId: command.poId,
        difference: matchResult.data.difference,
      });

      return Err(`Farq: ${matchResult.data.difference}. Xarid menejer tasdiqlashi kerak`);
    }

    const receiptResult = po.recordGoodsReceipt(command.quantity);
    if (!receiptResult.ok) {
      return Err(receiptResult.error);
    }

    const saveResult = await this.mmRepo.savePurchaseOrder(po);
    if (!saveResult.ok) {
      return Err(saveResult.error);
    }

    this.logger.log('Goods receipt recorded');
    return Ok(undefined);
  }
}
