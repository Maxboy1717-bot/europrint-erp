/**
 * @module mes-completed.listener
 * @description CQRS @EventsHandler for MesCompletedEvent (Trigger 10).
 *   Imports the canonical event class from the MES domain so that the CQRS
 *   EventBus dispatches to this handler when complete-session.handler publishes
 *   a MesCompletedEvent.
 *
 *   NOTE: The local MesCompletedEvent class that previously lived in this file
 *   (payload: orderId/batchId) has been removed — it was never emitted by any
 *   publisher and caused a silent no-op because the CQRS bus matches event
 *   handlers by class reference, not by name. The canonical event uses
 *   sessionId/timestamp.
 */

import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { IQcRepository, QC_REPOSITORY_PROVIDER } from '../../application/repositories/qc.repository';
import { MesCompletedEvent } from '../../../mes/domain/events/mes-completed.event';

@Injectable()
@EventsHandler(MesCompletedEvent)
export class MesCompletedListener implements IEventHandler<MesCompletedEvent> {
  private readonly logger = new Logger(MesCompletedListener.name);
  constructor(
    @Inject(QC_REPOSITORY_PROVIDER) private readonly qcRepository: IQcRepository,
  ) {}

  async handle(event: MesCompletedEvent): Promise<void> {
    try {
      this.logger.log(
        { sessionId: event.sessionId, timestamp: event.timestamp },
        'MES completed - Trigger 10: Opening QC inspection',
      );
      // QC inspection will be opened by PP module callback
    } catch (error: unknown) {
      this.logger.error('MES completed listener error');
    }
  }
}
