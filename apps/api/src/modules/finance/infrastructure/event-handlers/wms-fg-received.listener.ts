/**
 * @module wms-fg-received.listener
 * @description PA2-18 Wave 6: canonical CQRS @EventsHandler form. Reacts to
 *   `WmsFgReceivedEvent` (published by wms/receive-fg.handler.ts) and starts
 *   the warehouse rental timer for the order. Trigger 12.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { StartRentalTimerHandler, StartRentalTimerCommand } from '../../application/commands/start-rental-timer.handler';
import { WmsFgReceivedEvent } from '@modules/wms/application/events/wms-fg-received.event';

@Injectable()
@EventsHandler(WmsFgReceivedEvent)
export class WmsFgReceivedListener implements IEventHandler<WmsFgReceivedEvent> {
  private readonly logger = new Logger(WmsFgReceivedListener.name);

  constructor(private startRentalTimerHandler: StartRentalTimerHandler) {}

  async handle(event: WmsFgReceivedEvent): Promise<void> {
    try {
      // TODO PA2-18: emit-side publishes {materialId, amount, warehouseId, timestamp}
      // but the rental timer needs {orderId, areaM2}. Until receive-fg.handler is
      // refactored to carry orderId/areaM2, skip when those aren't present.
      if (event.orderId === undefined || event.areaM2 === undefined) {
        this.logger.debug(
          `Skipping rental timer: orderId/areaM2 missing in event (materialId=${event.materialId}, warehouseId=${event.warehouseId})`,
        );
        return;
      }

      this.logger.debug(
        `Processing WMS FG received event - Order: ${event.orderId}, Warehouse: ${event.warehouseId}`,
      );

      const command = new StartRentalTimerCommand(
        event.orderId,
        event.warehouseId,
        event.areaM2,
        event.timestamp,
      );

      const result = await this.startRentalTimerHandler.execute(command);

      if (!result.ok) {
        this.logger.error(`Rental timer start failed: ${result.error.message}`);
        return;
      }

      this.logger.log(
        `Warehouse rental timer started - Order: ${event.orderId}, Rental ID: ${result.data}`,
      );
    } catch (error: unknown) {
      this.logger.error(`Error processing WMS_FG_RECEIVED event: ${(error as Error).message}`);
    }
  }
}
