/**
 * @module goods-issue.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Err, Ok } from '@common/result';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { WmsGoodsIssuedEvent } from '../events/wms-goods-issued.event';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IWmsRepository, WMS_REPO } from '../../domain/repositories/wms.repository';

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
    @Inject(WMS_REPO) private wmsRepo: IWmsRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: GoodsIssueCommand): Promise<Result<void>> {
    this.logger.log(
      { materialId: command.materialId, amount: command.amount },
      'Issuing goods from canonical warehouse_stock',
    );

    // #08: chiqim decrements the CANONICAL warehouse_stock (the table receiveFg fills) via one guarded
    // atomic UPDATE — so a QC-passed FG that was received can actually be issued. The old path read the
    // non-canonical `stocks` table (empty for received FG) and the Stock aggregate's issue() required a
    // prior reserve, so it always failed. FEFO/batch-lot issue stays a separate deep-vision layer.
    const outcome = await this.wmsRepo.issueFromWarehouseStock(
      command.materialId,
      command.warehouseId,
      command.amount,
    );

    if (!outcome.ok) {
      return Err(outcome.error);
    }

    // Trigger 9: WMS Goods Issue → PP (fired only after the tx committed)
    this.eventBus.publish(new WmsGoodsIssuedEvent({
      materialId: command.materialId,
      amount: command.amount,
      ppId: command.ppId,
      timestamp: _time.now(),
    }));

    this.logger.log('Goods issued successfully');
    return Ok(undefined);
  }
}
