import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { safeDiv, stddev, safeAvg } from '@common/math/math-utils';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { AiDecisionLogService } from '../common/ai-decision-log.service';
import {
  AGENT_CODES, AI_GEMINI_MODEL,
  OEE_CRITICAL_THRESHOLD, OEE_WARNING_THRESHOLD,
  Z_THRESHOLD, Z_AUTO_STOP_THRESHOLD, Z_ROLLING_WINDOW,
} from '../common/ai-agents.constants';

export interface OeeInput {
  shiftHours:          number;
  downtimeMinutes:     number;
  idealCycleTimeMin:   number;
  qtyGood:             number;
  qtyScrap:            number;
}

export interface OeeResult {
  availability: number;
  performance:  number;
  quality:      number;
  oee:          number;
  severity:     'OK' | 'WARNING' | 'CRITICAL';
}

export interface AnomalyResult {
  machineId:   string;
  value:       number;
  zScore:      number;
  isAnomaly:   boolean;
  severity:    'NORMAL' | 'ALERT' | 'AUTO_STOP';
}

const TELEMETRY_INTERVAL_MS = 30_000;

@Injectable()
export class AiMesMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiMesMonitorService.name);
  private readonly rollingBuffers   = new Map<string, number[]>();
  private readonly stoppedMachines  = new Map<string, { stoppedAt: Date; reason: string }>();
  private telemetryTimer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly events:  EventEmitter2,
    private readonly logSvc:  AiDecisionLogService,
  ) {}

  onModuleInit(): void {
    this.telemetryTimer = setInterval(() => {
      this.runTelemetryCheck().catch((err: unknown) => {
        this.logger.error({ msg: 'Telemetry interval error', err });
      });
    }, TELEMETRY_INTERVAL_MS);
    this.logger.log('MES telemetry loop started (30s interval)');
  }

  onModuleDestroy(): void {
    if (this.telemetryTimer) clearInterval(this.telemetryTimer);
  }

  private async runTelemetryCheck(): Promise<void> {
    try {
      const result = await db.execute<{ machine_id: string; latest_value: string }>(sql`
        SELECT machine_id, value AS latest_value
        FROM mes_telemetry
        WHERE recorded_at >= NOW() - INTERVAL '1 minute'
        ORDER BY recorded_at DESC
      `);
      const rows = result.rows as { machine_id: string; latest_value: string }[];

      for (const row of rows) {
        const value = Number(row.latest_value ?? 0);
        if (!Number.isFinite(value)) continue;
        await this.detectAnomaly(row.machine_id, value, 'telemetry');
      }
    } catch (err) {
      this.logger.error({ msg: 'Telemetry check failed', err });
    }
  }

  calcOee(input: OeeInput): OeeResult {
    const ppt          = input.shiftHours * 60;
    const availability = safeDiv(ppt - input.downtimeMinutes, ppt);
    const actual       = input.qtyGood + input.qtyScrap;
    const performance  = Math.min(1.0, safeDiv(input.idealCycleTimeMin * actual, ppt - input.downtimeMinutes));
    const quality      = safeDiv(input.qtyGood, actual);
    const oee          = availability * performance * quality;

    const severity: OeeResult['severity'] = oee < OEE_CRITICAL_THRESHOLD ? 'CRITICAL'
      : oee < OEE_WARNING_THRESHOLD ? 'WARNING'
      : 'OK';

    return {
      availability: Math.round(availability * 1000) / 10,
      performance:  Math.round(performance * 1000) / 10,
      quality:      Math.round(quality * 1000) / 10,
      oee:          Math.round(oee * 1000) / 10,
      severity,
    };
  }

  getStoppedMachines(): Map<string, { stoppedAt: Date; reason: string }> {
    return this.stoppedMachines;
  }

  async resumeMachine(machineId: string): Promise<boolean> {
    if (!this.stoppedMachines.has(machineId)) return false;
    this.stoppedMachines.delete(machineId);
    this.events.emit('mes.machine.resumed', { machineId, resumedAt: new Date() });
    this.logger.log({ msg: 'Mashina tikland', machineId });
    return true;
  }

  async detectAnomaly(machineId: string, value: number, workOrderId: string): Promise<AnomalyResult> {
    const start         = Date.now();
    const canonicalInput = { machineId, workOrderId, valueBucket: Math.round(value * 10) };
    const inputHash      = this.logSvc.hashInput(canonicalInput);

    if (this.stoppedMachines.has(machineId)) {
      return { machineId, value, zScore: 0, isAnomaly: false, severity: 'AUTO_STOP' };
    }

    // 1-hour idempotency gate: if we already emitted an anomaly decision for this
    // machine+workOrder combination within the last hour, skip re-execution.
    const cached = await this.logSvc.findCachedDecision(AGENT_CODES.MES_MONITOR, inputHash).catch((err: unknown) => {
      this.logger.warn({ msg: 'MES cache lookup failed; computing fresh', machineId, err });
      return null;
    });
    if (cached) {
      const stored = cached.alternatives[0] as { zScore: number; isAnomaly: boolean; severity: AnomalyResult['severity'] } | undefined;
      if (stored) {
        return { machineId, value, zScore: stored.zScore, isAnomaly: stored.isAnomaly, severity: stored.severity };
      }
      const cachedSeverity = String(cached.action ?? 'NORMAL') as AnomalyResult['severity'];
      const cachedZ        = typeof cached.confidence === 'number' ? cached.confidence * 5 : 0;
      return { machineId, value, zScore: cachedZ, isAnomaly: cachedSeverity !== 'NORMAL', severity: cachedSeverity };
    }

    const buffer = this.rollingBuffers.get(machineId) ?? [];
    buffer.push(value);
    if (buffer.length > Z_ROLLING_WINDOW) buffer.shift();
    this.rollingBuffers.set(machineId, buffer);

    const mean   = safeAvg(buffer);
    const std    = stddev(buffer);
    const zScore = safeDiv(value - mean, std);
    const absZ   = Math.abs(zScore);

    let severity: AnomalyResult['severity'] = 'NORMAL';
    if (absZ > Z_AUTO_STOP_THRESHOLD)      severity = 'AUTO_STOP';
    else if (absZ > Z_THRESHOLD)           severity = 'ALERT';

    const isAnomaly = absZ > Z_THRESHOLD;

    if (severity === 'AUTO_STOP') {
      const reason = `Z=${zScore.toFixed(2)}, value=${value}`;
      this.stoppedMachines.set(machineId, { stoppedAt: new Date(), reason });
      this.logger.error({ msg: 'Mashina avto-to\'xtatish', machineId, zScore, value });
      this.events.emit('mes.machine.emergency_stop', { machineId, reason, timestamp: new Date() });

      await db.execute(sql`
        UPDATE mes_work_orders
        SET status = 'PAUSED', paused_at = NOW(), pause_reason = ${`AI_AUTO_STOP: ${reason}`}
        WHERE machine_id = ${machineId} AND status = 'IN_PROGRESS'
      `).catch((err: unknown) => {
        this.logger.error({ msg: 'Failed to persist auto-stop state', machineId, err });
      });
    } else if (severity === 'ALERT') {
      this.logger.warn({ msg: 'MES anomaly ALERT — HITL escalation required', machineId, zScore, value });
      this.events.emit('mes.machine.anomaly_alert', {
        machineId,
        zScore,
        value,
        absZ: Math.abs(zScore),
        timestamp: new Date(),
      });
    }

    if (isAnomaly) {
      const isTelemetry = workOrderId === 'telemetry';
      await this.logSvc.log({
        agentCode:    AGENT_CODES.MES_MONITOR,
        entityType:   isTelemetry ? 'machine' : 'work_order',
        entityId:     isTelemetry ? machineId : workOrderId,
        inputData:    canonicalInput,
        decision:     { action: severity, confidence: Math.min(1, absZ / 5), alternatives: [{ zScore, isAnomaly, severity }] },
        confidence:   Math.min(1, absZ / 5),
        modelVersion: AI_GEMINI_MODEL,
        autoExecuted: severity === 'AUTO_STOP',
        latencyMs:    Date.now() - start,
      });
    }

    return { machineId, value, zScore, isAnomaly, severity };
  }
}
