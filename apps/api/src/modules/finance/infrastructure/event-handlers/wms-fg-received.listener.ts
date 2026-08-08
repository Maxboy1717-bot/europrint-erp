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
      // T23-A2: the rental timer is attributed to a sales order, so an orderId is REQUIRED —
      // without it there is nothing to bill. areaM2, however, is now OPTIONAL: receive-fg.handler
      // resolves it from the FG material when it can (weight-unit roll FG), but piece-unit FG has
      // no storage footprint to derive. Rather than perpetually debug-skipping the rental the
      // moment areaM2 is unknown, we book the rental with the area PENDING (0) so the golden-thread
      // FI hop connects and the rental record exists to be amended with the real area later.
      // Q-40: areaM2=0 is an explicit "pending", not a fabricated figure.
      if (event.orderId === undefined) {
        this.logger.debug(
          `Skipping rental timer: orderId missing in event (materialId=${event.materialId}, warehouseId=${event.warehouseId})`,
        );
        return;
      }

      const areaM2 = event.areaM2 != null && Number.isFinite(event.areaM2) && event.areaM2 > 0 ? event.areaM2 : 0;

      this.logger.debug(
        `Processing WMS FG received event - Order: ${event.orderId}, Warehouse: ${event.warehouseId}, areaM2: ${areaM2}${areaM2 === 0 ? ' (pending)' : ''}`,
      );

      const command = new StartRentalTimerCommand(
        event.orderId,
        event.warehouseId,
        areaM2,
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
