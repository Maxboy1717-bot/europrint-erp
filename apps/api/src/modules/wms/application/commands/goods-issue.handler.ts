import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AppErr, Err , Ok } from '@common/result';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IWmsRepository } from '../../domain/repositories/wms.repository';

export class GoodsIssueCommand {
  constructor(public materialId: number,
    public warehouseId: number,
    public amount: number,
    public ppId: number) {}
}

@CommandHandler(GoodsIssueCommand)
export class GoodsIssueHandler implements ICommandHandler<GoodsIssueCommand> {
  private readonly logger = new Logger(GoodsIssueHandler.name);
  constructor(
    @Inject('IWmsRepository') private wmsRepo: IWmsRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: GoodsIssueCommand): Promise<Result<void>> {
    this.logger.log(
      { materialId: command.materialId, amount: command.amount },
      'Issuing goods - FEFO order',
    );

    // §8.5 FEFO/FIFO: Get stock ordered by expiry date
    const stockResult = await this.wmsRepo.getFefoStock(command.materialId, command.warehouseId);
    if (!stockResult.ok) {
      return Err(stockResult.error);
    }

    if (stockResult.data.length === 0) {
      return Err(AppErr('NOT_FOUND', 'Stock topilmadi'));
    }

    let remainingAmount = command.amount;
    for (const stock of stockResult.data) {
      if (remainingAmount <= 0) break;

      const toIssue = Math.min(stock.getAvailableQuantity(), remainingAmount);
      if (toIssue <= 0) continue;

      const issueResult = stock.issue(toIssue);
      if (!issueResult.ok) {
        return issueResult;
      }

      const saveResult = await this.wmsRepo.saveStock(stock);
      if (!saveResult.ok) {
        return Err(saveResult.error);
      }

      remainingAmount -= toIssue;
    }

    if (remainingAmount > 0) {
      return Err(`Yetarli stock yo'q. Etishmayotgan: ${remainingAmount}`);
    }

    // Trigger 9: WMS Goods Issue → PP
    this.eventBus.publish('WMS_GOODS_ISSUED', {
      materialId: command.materialId,
      amount: command.amount,
      ppId: command.ppId,
      timestamp: _time.now(),
    });

    this.logger.log('Goods issued successfully');
    return Ok(undefined);
  }
}
