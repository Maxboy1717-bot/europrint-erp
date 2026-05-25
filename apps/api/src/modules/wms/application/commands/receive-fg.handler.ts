/**
 * @module receive-fg.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Ok, Err } from '@common/result';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { Stock } from '../../domain/aggregates/stock.aggregate';
import { IWmsRepository, WMS_REPO } from '../../domain/repositories/wms.repository';
import { WmsFgReceivedEvent } from '../events/wms-fg-received.event';

export class ReceiveFgCommand {
  constructor(public materialId: number,
    public warehouseId: number,
    public amount: number,
    public batchNumber: string,
    public expiryDate: Date | null = null) {}
}

@CommandHandler(ReceiveFgCommand)
export class ReceiveFgHandler implements ICommandHandler<ReceiveFgCommand> {
  private readonly logger = new Logger(ReceiveFgHandler.name);
  constructor(
    @Inject(WMS_REPO) private wmsRepo: IWmsRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: ReceiveFgCommand): Promise<Result<void>> {
    this.logger.log(
      { materialId: command.materialId, amount: command.amount },
      'Receiving finished goods',
    );

    // Create new stock for FG
    const stock = new Stock(
      0,
      command.warehouseId,
      command.materialId,
      command.amount,
      command.expiryDate,
      command.batchNumber,
    );

    const saveResult = await this.wmsRepo.saveStock(stock);
    if (!saveResult.ok) {
      return Err(saveResult.error);
    }

    // Trigger 12: WMS FG → FI ijara taymer
    // PA2-18 Wave 6: canonical class form; EventBridge re-emits to legacy @OnEvent listeners.
    this.eventBus.publish(
      new WmsFgReceivedEvent(
        command.materialId,
        command.amount,
        command.warehouseId,
        _time.now(),
      ),
    );

    this.logger.log('Finished goods received');
    return Ok(undefined);
  }
}
