/**
 * @module anomaly-detected.handler
 * @description CQRS event handler. Persists each AnomalyDetectedEvent as a row in
 *              iot_alerts so it surfaces on the IoT dashboard (active-alerts /
 *              GetAnomalies query) and an operator can acknowledge/resolve it.
 *
 *  Live iot_alerts schema:
 *    id SERIAL PK, sensor_id INTEGER NOT NULL, alert_type VARCHAR(20), severity VARCHAR(10),
 *    message TEXT, value NUMERIC(18,4), threshold NUMERIC(18,4),
 *    is_resolved BOOLEAN DEFAULT false, resolved_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
 *
 *  Fix (2026-06-20): value and threshold columns exist in the live DB.
 *    - Before INSERT, fetch max_threshold from iot_sensors WHERE id = sensorId.
 *    - INSERT now includes value = event.value, threshold = fetched max_threshold (or null).
 *    - sensor_id is NOT NULL in DB; if deviceId is non-numeric the INSERT is skipped with an error log.
 */

import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { typedExecute } from '@shared/db/typed-execute';
import { sql } from 'drizzle-orm';
import { AnomalyDetectedEvent } from '../../domain/events';

@Injectable()
@EventsHandler(AnomalyDetectedEvent)
export class AnomalyDetectedHandler implements IEventHandler<AnomalyDetectedEvent> {
  private readonly logger = new Logger(AnomalyDetectedHandler.name);

  async handle(event: AnomalyDetectedEvent): Promise<void> {
    // sensor_id is NOT NULL in iot_alerts — skip insert if deviceId is not a valid integer.
    const sensorIdRaw = parseInt(event.deviceId ?? '', 10);
    const sensorId: number | null = Number.isFinite(sensorIdRaw) && sensorIdRaw > 0 ? sensorIdRaw : null;

    if (sensorId === null) {
      this.logger.error(
        { deviceId: event.deviceId },
        'AnomalyDetectedHandler: deviceId is not a valid sensor integer — alert not persisted',
      );
      return;
    }

    // Fetch per-sensor threshold from iot_sensors.max_threshold.
    let fetchedThreshold: number | null = null;
    try {
      const rows = await typedExecute<{ max_threshold: string | null }>(sql`
        SELECT max_threshold FROM iot_sensors WHERE id = ${sensorId} LIMIT 1
      `);
      const first = Array.isArray(rows) ? rows[0] : undefined;
      if (first?.max_threshold != null) {
        fetchedThreshold = parseFloat(first.max_threshold);
      }
    } catch (lookupErr: unknown) {
      // Non-fatal: continue insert with threshold = null
      const msg = lookupErr instanceof Error ? lookupErr.message : String(lookupErr);
      this.logger.warn({ sensorId, cause: msg }, 'Could not fetch sensor threshold — inserting alert with threshold=null');
    }

    // Build a human-readable message that includes the anomaly value and type.
    const message = `Mashina ${event.machineId}: ${event.anomalyType} anomaliya (qiymat=${event.value})`;

    try {
      // INSERT with value and threshold so operators see what was measured vs what the limit is.
      await db.execute(sql`
        INSERT INTO iot_alerts (sensor_id, alert_type, severity, message, value, threshold, is_resolved, created_at)
        VALUES (${sensorId}, ${event.anomalyType}, 'high', ${message}, ${event.value}, ${fetchedThreshold}, false, NOW())
      `);
      this.logger.warn(
        {
          deviceId: event.deviceId,
          machineId: event.machineId,
          anomalyType: event.anomalyType,
          value: event.value,
          threshold: fetchedThreshold,
        },
        'Anomaly detected -> iot_alerts row created with value and threshold',
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error({ deviceId: event.deviceId, cause: msg }, 'AnomalyDetectedHandler failed to persist alert');
    }
  }
}
