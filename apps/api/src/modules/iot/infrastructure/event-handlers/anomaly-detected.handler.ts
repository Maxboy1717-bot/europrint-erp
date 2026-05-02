import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { AnomalyDetectedEvent } from '../../domain/events';

@Injectable()
@EventsHandler(AnomalyDetectedEvent)
export class AnomalyDetectedHandler implements IEventHandler<AnomalyDetectedEvent> {
  private readonly logger = new Logger(AnomalyDetectedHandler.name);

  

  async handle(event: AnomalyDetectedEvent): Promise<void> {
    this.logger.error(
      {
        deviceId: event.deviceId,
        machineId: event.machineId,
        anomalyType: event.anomalyType,
        value: event.value,
      },
      'Anomaly detected - IoT event emitted');
  }
}
