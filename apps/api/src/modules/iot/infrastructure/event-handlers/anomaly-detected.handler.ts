/**
 * @module anomaly-detected.handler
 * @description CQRS event handler. Persists each AnomalyDetectedEvent as a row in
 *              iot_alerts so it surfaces on the IoT dashboard (active-alerts /
 *              GetAnomalies query) and an operator can acknowledge/resolve it.
 *
 *  Live iot_alerts schema (migration 0000):
 *    id SERIAL PK, sensor_id INTEGER, alert_type TEXT, severity TEXT,
 *    message TEXT, is_resolved BOOLEAN DEFAULT false, resolved_at TIMESTAMPTZ,
 *    created_at TIMESTAMPTZ DEFAULT NOW()
 *  NOTE: `value` and `threshold` columns do NOT exist in the live migration —
 *        they are present only in the lib/db canonical schema (not yet migrated).
 *        Do NOT INSERT value/threshold until a migration adds them.
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
    // Persist the anomaly to iot_alerts using only columns that exist in the live DB.
    // sensor_id is nullable integer — use the numeric part of deviceId when valid, else NULL.
    const sensorIdRaw = parseInt(event.deviceId ?? '', 10);
    const sensorId: number | null = Number.isFinite(sensorIdRaw) && sensorIdRaw > 0 ? sensorIdRaw : null;
    // Build a human-readable message that includes the anomaly value and type.
    const message = `Mashina ${event.machineId}: ${event.anomalyType} anomaliya (qiymat=${event.value})`;

    try {
      // Real INSERT — no `value`/`threshold` columns (not in live migration yet).
      await db.execute(sql`
        INSERT INTO iot_alerts (sensor_id, alert_type, severity, message, is_resolved, created_at)
        VALUES (${sensorId}, ${event.anomalyType}, 'high', ${message}, false, NOW())
      `);
      this.logger.warn(
        { deviceId: event.deviceId, machineId: event.machineId, anomalyType: event.anomalyType, value: event.value },
        'Anomaly detected -> iot_alerts row created',
      );
    } catch (error: unknown) {
      // Log the root cause so it is visible in structured logs without exposing stack traces.
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error({ deviceId: event.deviceId, cause: msg }, 'AnomalyDetectedHandler failed to persist alert');
    }
  }
}
