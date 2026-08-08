/**
 * @module record-sensor-reading.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Result, Ok } from '@common/result';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { RecordSensorReadingCommand } from './record-sensor-reading.command';
import { SensorReading } from '../../domain/aggregates/sensor-reading.aggregate';
import { AnomalyDetectedEvent } from '../../domain/events';
import { ITelegramSender, TELEGRAM_SENDER } from '@modules/notifications/domain/ports/i-telegram-sender.port';
import { ISensorRepo, SENSOR_REPO } from '../../domain/repositories/i-sensor.repo';

@Injectable()
@CommandHandler(RecordSensorReadingCommand)
export class RecordSensorReadingHandler implements ICommandHandler<RecordSensorReadingCommand> {
  private readonly logger = new Logger(RecordSensorReadingHandler.name);

  constructor(
    private readonly eventBus: EventBus,
    @Inject(TELEGRAM_SENDER) private readonly telegramService: ITelegramSender,
    @Inject(SENSOR_REPO) private readonly sensorRepo: ISensorRepo,
  ) {}

  async execute(command: RecordSensorReadingCommand): Promise<Result<string>> {
      const reading = SensorReading.create(command.deviceId, command.value, command.unit);

      // Leverage #6: was a fake-create (no repo → reading never persisted). Persist to iot_sensor_readings.
      const saveResult = await this.sensorRepo.saveReading(reading);
      if (!saveResult.ok) {
        this.logger.error('Failed to persist sensor reading');
        return saveResult as unknown as Result<string>;
      }

      // A80 — IoT 3-sensor feed → mes_telemetry. The AI MES monitor (AiMesMonitorService)
      // SELECTs `value` keyed by machine_id from mes_telemetry on a 30s rolling-window; until
      // now that table had no writer. Feed each accepted sensor reading into the MES telemetry
      // stream so the anomaly monitor acts on real device data. Non-fatal: a telemetry-feed
      // failure must not roll back the primary reading persistence above.
      // DB defaults fill id (gen_random_uuid), recorded_at + created_at (now()).
      await this.feedMesTelemetry(command);

      // Anomaly detection logic
      const isAnomaly = await this.detectAnomaly(command.deviceId, command.value);
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

      this.logger.log('Sensor reading recorded and persisted');
      return Ok(saveResult.data.id);
  }

  /**
   * M6 (2026-07-05): used to ignore the device entirely and apply a flat >90
   * threshold to every sensor -- a temperature sensor and a humidity sensor got
   * the identical cutoff despite iot_sensors.min_threshold/max_threshold existing
   * specifically to configure this per device. Now reads the device's own
   * thresholds (set via RegisterDeviceHandler/UpdateDeviceThresholdsHandler) and
   * only falls back to the generic 90 when a device has none configured.
   */
  private async detectAnomaly(deviceId: string, value: number): Promise<boolean> {
    const deviceR = await this.sensorRepo.findDeviceById(deviceId);
    const thresholds = deviceR.ok ? deviceR.data.thresholds : undefined;
    if (thresholds?.max !== undefined && thresholds.max !== null) {
      return value > thresholds.max || (thresholds.min !== undefined && thresholds.min !== null && value < thresholds.min);
    }
    const FALLBACK_THRESHOLD = 90;
    return value > FALLBACK_THRESHOLD;
  }

  /**
   * Feeds one sensor reading into mes_telemetry (the stream the AI MES monitor consumes).
   * Writes both metric_value and value because AiMesMonitorService reads the `value` column;
   * metric_type carries the reading unit. id/recorded_at/created_at use DB defaults.
   * Parameterized SQL (Drizzle barrel lacks mes_telemetry). Failures are logged, not thrown,
   * so the telemetry feed never breaks the primary iot_sensor_readings persistence.
   */
  private async feedMesTelemetry(command: RecordSensorReadingCommand): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO mes_telemetry (machine_id, metric_type, metric_value, value)
        VALUES (${command.machineId}, ${command.unit}, ${command.value}, ${command.value})
      `);
    } catch (err) {
      this.logger.warn({ msg: 'mes_telemetry feed failed (non-fatal)', machineId: command.machineId, err });
    }
  }
}
