import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { IQcRepository } from '../../application/repositories/qc.repository';

export class MesCompletedEvent {
  private readonly logger = new Logger(MesCompletedEvent.name);

  constructor(readonly orderId: number,
    readonly batchId: string) {}
}

@Injectable()
@EventsHandler(MesCompletedEvent)
export class MesCompletedListener implements IEventHandler<MesCompletedEvent> {
  private readonly logger = new Logger(MesCompletedListener.name);
  constructor(
    @Inject('IQcRepository') private readonly qcRepository: IQcRepository,
  ) {}

  async handle(event: MesCompletedEvent): Promise<void> {
    try {
      this.logger.log(
        { orderId: event.orderId, batchId: event.batchId },
        'MES completed - Trigger 10: Opening QC inspection',
      );
      // QC inspection will be opened by PP module callback
    } catch (error: unknown) {
      this.logger.error('MES completed listener error');
    }
  }
}
