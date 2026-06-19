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
import { IWmsRepository, WMS_REPO } from '../../domain/repositories/wms.repository';
import { WmsFgReceivedEvent } from '../events/wms-fg-received.event';

export class ReceiveFgCommand {
  constructor(
    public materialId: number,
    public warehouseId: number,
    public amount: number,
    public batchNumber: string,
    public expiryDate: Date | null = null,
    /** orderId enables the rental-timer trigger in WmsFgReceivedListener (Trigger 12). */
    public orderId?: number,
    public areaM2?: number,
  ) {}
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

    // Canonical FG receipt: warehouse_stock idempotent UPSERT (ON CONFLICT
    // (warehouse_id, material_id), backed by execReceiveFg). The legacy
    // saveStock() targeted the non-canonical `stocks` table, so QC-passed
    // finished goods never became visible to downstream WMS/POS Monitor readers
    // (golden-thread break #8). receiveFg() lands the FG in warehouse_stock.
    const saveResult = await this.wmsRepo.receiveFg(
      command.materialId,
      command.warehouseId,
      command.amount,
    );
    if (!saveResult.ok) {
      return Err(saveResult.error);
    }

    // Trigger 12: WMS FG → FI ijara taymer
    // PA2-18 Wave 6: canonical class form; EventBridge re-emits to legacy @OnEvent listeners.
    // orderId/areaM2 are optional; when present, WmsFgReceivedListener starts the rental timer.
    this.eventBus.publish(
      new WmsFgReceivedEvent(
        command.materialId,
        command.amount,
        command.warehouseId,
        _time.now(),
        command.orderId,
        command.areaM2,
      ),
    );

    this.logger.log('Finished goods received');
    return Ok(undefined);
  }
}
