/**
 * @module anomaly-detected.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { AnomalyDetectedEvent } from '../../domain/events';

@Injectable()
@EventsHandler(AnomalyDetectedEvent)
export class AnomalyDetectedHandler implements IEventHandler<AnomalyDetectedEvent> {
  private readonly logger = new Logger(AnomalyDetectedHandler.name);

  async handle(event: AnomalyDetectedEvent): Promise<void> {
    // Was a NO-OP (logged only). Persist the anomaly to iot_alerts so it surfaces on the IoT
    // dashboard (active-alerts / GetAnomalies query) and an operator can resolve it.
    // sensor_id is integer with no FK; the event's deviceId is a numeric device id (NaN -> 0).
    try {
      const sensorId = Number(event.deviceId);
      const message = `Mashina ${event.machineId}: ${event.anomalyType} anomaliya (qiymat=${event.value})`;
      await db.execute(sql`
        INSERT INTO iot_alerts (sensor_id, alert_type, severity, message, value, is_resolved, created_at)
        VALUES (${Number.isFinite(sensorId) ? sensorId : 0}, ${event.anomalyType}, 'high', ${message}, ${event.value}, false, NOW())`);
      this.logger.warn(
        { deviceId: event.deviceId, machineId: event.machineId, anomalyType: event.anomalyType, value: event.value },
        'Anomaly detected -> iot_alerts row created');
    } catch (error: unknown) {
      this.logger.error('Anomaly handler failed to persist alert');
    }
  }
}
