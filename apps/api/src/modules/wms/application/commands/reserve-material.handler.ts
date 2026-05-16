/**
 * @module reserve-material.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { AppErr, Err , Ok } from '@common/result';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IWmsRepository, WMS_REPO } from '../../domain/repositories/wms.repository';

export class ReserveMaterialCommand {
  constructor(public materialId: number,
    public warehouseId: number,
    public amount: number,
    public ppId: number) {}
}

@CommandHandler(ReserveMaterialCommand)
export class ReserveMaterialHandler implements ICommandHandler<ReserveMaterialCommand> {
  private readonly logger = new Logger(ReserveMaterialHandler.name);
  constructor(
    @Inject(WMS_REPO) private wmsRepo: IWmsRepository
  ) {}

  async execute(command: ReserveMaterialCommand): Promise<Result<void>> {
    this.logger.log(
      { materialId: command.materialId, amount: command.amount },
      'Reserving material',
    );

    const stocks = await this.wmsRepo.getStockByMaterialAndWarehouse(
      command.materialId,
      command.warehouseId,
    );

    if (!stocks.ok || stocks.data.length === 0) {
      return Err(AppErr('NOT_FOUND', 'Material topilmadi'));
    }

    let remainingAmount = command.amount;
    for (const stock of stocks.data) {
      if (remainingAmount <= 0) break;

      const toReserve = Math.min(stock.getAvailableQuantity(), remainingAmount);
      if (toReserve <= 0) continue;

      const reserveResult = stock.reserve(toReserve);
      if (!reserveResult.ok) {
      return Err(reserveResult.error);
    }

      const saveResult = await this.wmsRepo.saveStock(stock);
      if (!saveResult.ok) {
      return Err(saveResult.error);
    }

      remainingAmount -= toReserve;
    }

    if (remainingAmount > 0) {
      return Err(`Yetarli stock yo'q. Etishmayotgan: ${remainingAmount}`);
    }

    this.logger.log('Material reserved');
    return Ok(undefined);
  }
}
