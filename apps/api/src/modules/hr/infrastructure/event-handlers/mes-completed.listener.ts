/**
 * @module mes-completed.listener
 * @description Source module. See exports for details.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CommandBus } from '@nestjs/cqrs';
import { Record360FeedbackCommand } from '../../application/commands/record-360-feedback.handler';

export interface MesTo360Event {
  operatorId: number;
  orderId: number;
  sessionId: string;
  quantity: number;
  defectRate: number;
  oee: number;
}

@Injectable()
export class MesTo360Listener {
  private readonly logger = new Logger(MesTo360Listener.name);

  constructor(private readonly commandBus: CommandBus) {}

  @OnEvent('MES_TO_HR_360', { async: true })
  async handle(event: MesTo360Event): Promise<void> {
    try {
      this.logger.debug(
        `Processing MES → HR 360° event - Operator: ${event.operatorId}, Order: ${event.orderId}`,
      );

      const result = await this.commandBus.execute(
        new Record360FeedbackCommand(
          event.operatorId,
          event.orderId,
          event.sessionId,
          event.quantity,
          event.defectRate,
          event.oee,
        ),
      );

      if (!result.ok) {
        this.logger.error(`Failed to record 360° feedback: ${result.error}`);
        return;
      }

      this.logger.log(
        `HR 360° feedback recorded from MES - Operator: ${event.operatorId}`,
      );
    } catch (error: unknown) {
      this.logger.error(`MesTo360Listener: ${(error as Error).message}`);
    }
  }
}
