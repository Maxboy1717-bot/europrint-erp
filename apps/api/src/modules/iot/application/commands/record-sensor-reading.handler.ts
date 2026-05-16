/**
 * @module record-sensor-reading.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Result, Ok } from '@common/result';
import { RecordSensorReadingCommand } from './record-sensor-reading.command';
import { SensorReading } from '../../domain/aggregates/sensor-reading.aggregate';
import { AnomalyDetectedEvent } from '../../domain/events';
import { ITelegramSender, TELEGRAM_SENDER } from '@modules/notifications/domain/ports/i-telegram-sender.port';

@Injectable()
@CommandHandler(RecordSensorReadingCommand)
export class RecordSensorReadingHandler implements ICommandHandler<RecordSensorReadingCommand> {
  private readonly logger = new Logger(RecordSensorReadingHandler.name);

  constructor(
    private readonly eventBus: EventBus,
    @Inject(TELEGRAM_SENDER) private readonly telegramService: ITelegramSender,
      ) {}

  async execute(command: RecordSensorReadingCommand): Promise<Result<string>> {
      const reading = SensorReading.create(command.deviceId, command.value, command.unit);

      // Anomaly detection logic
      const isAnomaly = this.detectAnomaly(command.value);
      if (isAnomaly) {
        reading.markAsAnomaly();
        this.eventBus.publish(
          new AnomalyDetectedEvent(command.deviceId, command.machineId, 'high_value', command.value),
        );

        // Send Telegram alert
        await this.telegramService.sendAlert(
          'iot_channel',
          `Anomaly detected on machine ${command.machineId}: value=${command.value}`,
        );
        this.logger.warn('Anomaly detected');
      }

      this.logger.log('Sensor reading recorded');
      return Ok(reading.id);
  }

  private detectAnomaly(value: number): boolean {
    const threshold = 90;
    return value > threshold;
  }
}
