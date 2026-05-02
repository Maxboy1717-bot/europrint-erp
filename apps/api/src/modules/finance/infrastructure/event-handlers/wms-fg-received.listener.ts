import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { StartRentalTimerHandler, StartRentalTimerCommand } from '../../application/commands/start-rental-timer.handler';

export interface WmsFgReceivedEvent {
  orderId: number;
  warehouseId: number;
  areaM2: number;
  receivedDate: Date;
}

@Injectable()
export class WmsFgReceivedListener {
  private readonly logger = new Logger(WmsFgReceivedListener.name);

  constructor(private startRentalTimerHandler: StartRentalTimerHandler) {}

  @OnEvent('WMS_FG_RECEIVED', { async: true })
  async handle(event: WmsFgReceivedEvent): Promise<void> {
    try {
      this.logger.debug(
        `Processing WMS FG received event - Order: ${event.orderId}, Warehouse: ${event.warehouseId}`
      );

      const command = new StartRentalTimerCommand(
        event.orderId,
        event.warehouseId,
        event.areaM2,
        event.receivedDate
      );

      const result = await this.startRentalTimerHandler.execute(command);

      if (!result.ok) {
        this.logger.error(`Rental timer start failed: ${(result).error}`);
        return;
      }

      this.logger.log(
        `Warehouse rental timer started - Order: ${event.orderId}, Rental ID: ${(result).data}`
      );
    } catch (error: unknown) {
      this.logger.error(`Error processing WMS_FG_RECEIVED event: ${(error as Error).message}`);
    }
  }
}
