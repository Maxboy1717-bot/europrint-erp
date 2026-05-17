/**
 * @module mes-completed.listener
 * @description PA2-18 Wave 6: canonical CQRS @EventsHandler form. Reacts to
 *   `MesToHr360Event` (published by mes/complete-session.handler.ts) and
 *   records 360° feedback for the operator. Trigger 16.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { Record360FeedbackCommand } from '../../application/commands/record-360-feedback.handler';
import { MesToHr360Event } from '@modules/mes/domain/events/mes-to-hr-360.event';

@Injectable()
@EventsHandler(MesToHr360Event)
export class MesTo360Listener implements IEventHandler<MesToHr360Event> {
  private readonly logger = new Logger(MesTo360Listener.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: MesToHr360Event): Promise<void> {
    try {
      this.logger.debug(
        `Processing MES → HR 360° event - Operator: ${event.operatorId}, Session: ${event.sessionId}`,
      );

      // TODO PA2-18: emit-side currently only carries {sessionId, operatorId, timestamp}.
      // The 360° feedback record requires {orderId, quantity, defectRate, oee} which the
      // session aggregate exposes. Until complete-session.handler.ts pulls those fields
      // through, default to 0 so the command can still be issued.
      const result = await this.commandBus.execute(
        new Record360FeedbackCommand(
          event.operatorId,
          event.orderId ?? 0,
          String(event.sessionId),
          event.quantity ?? 0,
          event.defectRate ?? 0,
          event.oee ?? 0,
        ),
      );

      if (!result.ok) {
        this.logger.error(`Failed to record 360° feedback: ${result.error.message}`);
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
