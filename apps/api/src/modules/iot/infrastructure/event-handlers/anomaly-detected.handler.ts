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
 *
 *  Fix (VISION-3340 #20, 2026-07-08): severity was hardcoded to 'high' and the
 *  handler only ever wrote iot_alerts — a genuinely critical sensor breach never
 *  stopped the machine. Severity is now derived from value/threshold ratio
 *  (IOT_ANOMALY_CRITICAL_THRESHOLD_RATIO): a ratio at/above that cutoff is
 *  classified 'critical' and, IN ADDITION to the iot_alerts INSERT, the handler
 *  dispatches MES's own PauseSessionCommand via CommandBus (pause-session.handler.ts)
 *  to flip the related production_sessions row to 'paused' — same cross-module
 *  CommandBus bridge pattern IotTabletController.reportProductionDefect already
 *  uses to reach a different module's aggregate (there: QC's ReportDefectCommand)
 *  instead of writing another module's table directly.
 */

import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { typedExecute } from '@shared/db/typed-execute';
import { sql } from 'drizzle-orm';
import { AnomalyDetectedEvent } from '../../domain/events';
import { PauseSessionCommand } from '@modules/mes/application/commands/pause-session.command';
import { IOT_ANOMALY_CRITICAL_THRESHOLD_RATIO } from '@common/constants/business.constants';

@Injectable()
@EventsHandler(AnomalyDetectedEvent)
export class AnomalyDetectedHandler implements IEventHandler<AnomalyDetectedEvent> {
  private readonly logger = new Logger(AnomalyDetectedHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

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

    // VISION-3340 #20: severity is derived from how far the measured value is
    // over the sensor's own configured limit, instead of being hardcoded.
    // No threshold configured (or threshold <= 0) => ratio cannot be computed
    // => stays 'high' (fail-safe: never silently escalate without real data, Q-40).
    const ratio = fetchedThreshold !== null && fetchedThreshold > 0
      ? event.value / fetchedThreshold
      : null;
    const isCritical = ratio !== null && ratio >= IOT_ANOMALY_CRITICAL_THRESHOLD_RATIO;
    const severity = isCritical ? 'critical' : 'high';

    // Build a human-readable message that includes the anomaly value and type.
    const message = `Mashina ${event.machineId}: ${event.anomalyType} anomaliya (qiymat=${event.value})`;

    try {
      // INSERT with value and threshold so operators see what was measured vs what the limit is.
      await db.execute(sql`
        INSERT INTO iot_alerts (sensor_id, alert_type, severity, message, value, threshold, is_resolved, created_at)
        VALUES (${sensorId}, ${event.anomalyType}, ${severity}, ${message}, ${event.value}, ${fetchedThreshold}, false, NOW())
      `);
      this.logger.warn(
        {
          deviceId: event.deviceId,
          machineId: event.machineId,
          anomalyType: event.anomalyType,
          value: event.value,
          threshold: fetchedThreshold,
          severity,
        },
        'Anomaly detected -> iot_alerts row created with value and threshold',
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error({ deviceId: event.deviceId, cause: msg }, 'AnomalyDetectedHandler failed to persist alert');
    }

    // CRITICAL breach: additionally pause the related MES production session —
    // the iot_alerts row above is written either way (no-throw path above already
    // covers that); this is purely additive and never suppresses/rolls back it.
    if (isCritical) {
      await this.pauseRelatedSession(event, sensorId, fetchedThreshold);
    }
  }

  /**
   * Resolves the currently running/in_progress production_sessions row for the
   * anomaly's machine and dispatches MES's PauseSessionCommand (CommandBus) to
   * flip it to 'paused'. MesModule already provides PauseSessionHandler (see
   * pause-session.handler.ts) and is loaded in AppModule, so the command is
   * dispatchable here without IotModule importing MesModule — identical
   * cross-module convention to IotTabletController.reportProductionDefect's
   * ReportDefectCommand dispatch into the QC module.
   *
   * Best-effort: machine-id parse failure, no matching running session, or a
   * command-dispatch error are all logged and swallowed — a pause failure must
   * never throw back into the event bus / lose the anomaly alert already persisted.
   */
  private async pauseRelatedSession(
    event: AnomalyDetectedEvent,
    sensorId: number,
    threshold: number | null,
  ): Promise<void> {
    const machineIdRaw = parseInt(event.machineId ?? '', 10);
    if (!Number.isFinite(machineIdRaw) || machineIdRaw <= 0) {
      this.logger.error(
        { machineId: event.machineId, sensorId },
        'CRITICAL anomaly: machineId is not a valid integer -- cannot resolve production_sessions row to pause',
      );
      return;
    }

    try {
      const rows = await typedExecute<{ id: number }>(sql`
        SELECT id FROM production_sessions
        WHERE machine_id = ${machineIdRaw}
          AND status IN ('running', 'in_progress')
          AND deleted_at IS NULL
        ORDER BY started_at DESC NULLS LAST
        LIMIT 1
      `);
      const sessionId = Array.isArray(rows) ? rows[0]?.id : undefined;

      if (sessionId == null) {
        this.logger.warn(
          { machineId: event.machineId, sensorId },
          'CRITICAL anomaly: no running/in_progress production_sessions row found for this machine -- nothing paused',
        );
        return;
      }

      const reason = `CRITICAL anomaliya: ${event.anomalyType} (qiymat=${event.value}${threshold !== null ? `, chegara=${threshold}` : ''})`;
      await this.commandBus.execute(new PauseSessionCommand(sessionId, reason));
      this.logger.warn(
        {
          sessionId,
          machineId: event.machineId,
          sensorId,
          anomalyType: event.anomalyType,
          value: event.value,
          threshold,
        },
        'CRITICAL anomaly -> production_sessions paused via PauseSessionCommand',
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        { machineId: event.machineId, sensorId, cause: msg },
        'CRITICAL anomaly: PauseSessionCommand dispatch failed',
      );
    }
  }
}
