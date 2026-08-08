/**
 * @module mes-monitor.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM query builder cannot
 *   express: `NOW() - INTERVAL '1 minute'` rolling-window time filter on
 *   telemetry stream, and target tables (mes_telemetry, mes_work_orders) are
 *   not present in the Drizzle schema barrel. The UPDATE sets a computed
 *   `pause_reason` containing an interpolated AI_AUTO_STOP reason string.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

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
    const start = Date.now();
    const canonicalInput = { machineId, workOrderId, valueBucket: Math.round(value * 10) };
    const inputHash = this.logSvc.hashInput(canonicalInput);

    if (this.stoppedMachines.has(machineId)) {
      return { machineId, value, zScore: 0, isAnomaly: false, severity: 'AUTO_STOP' };
    }
    const cachedResult = await this.tryCachedAnomaly(machineId, value, inputHash);
    if (cachedResult) return cachedResult;

    const { zScore, absZ } = this.computeZScore(machineId, value);
    const severity = this.classifySeverity(absZ);
    const isAnomaly = absZ > Z_THRESHOLD;

    await this.handleSeverityAction(severity, machineId, value, zScore);

    if (isAnomaly) {
      await this.logAnomalyDecision(machineId, workOrderId, canonicalInput, severity, zScore, isAnomaly, absZ, start);
    }
    return { machineId, value, zScore, isAnomaly, severity };
  }

  private async tryCachedAnomaly(machineId: string, value: number, inputHash: string): Promise<AnomalyResult | null> {
    const cached = await this.logSvc.findCachedDecision(AGENT_CODES.MES_MONITOR, inputHash).catch((err: unknown) => {
      this.logger.warn({ msg: 'MES cache lookup failed; computing fresh', machineId, err });
      return null;
    });
    if (!cached) return null;
    const stored = cached.alternatives[0] as { zScore: number; isAnomaly: boolean; severity: AnomalyResult['severity'] } | undefined;
    if (stored) {
      return { machineId, value, zScore: stored.zScore, isAnomaly: stored.isAnomaly, severity: stored.severity };
    }
    const cachedSeverity = String(cached.action ?? 'NORMAL') as AnomalyResult['severity'];
    const cachedZ = typeof cached.confidence === 'number' ? cached.confidence * 5 : 0;
    return { machineId, value, zScore: cachedZ, isAnomaly: cachedSeverity !== 'NORMAL', severity: cachedSeverity };
  }

  private computeZScore(machineId: string, value: number): { zScore: number; absZ: number } {
    const buffer = this.rollingBuffers.get(machineId) ?? [];
    buffer.push(value);
    if (buffer.length > Z_ROLLING_WINDOW) buffer.shift();
    this.rollingBuffers.set(machineId, buffer);
    const zScore = safeDiv(value - safeAvg(buffer), stddev(buffer));
    return { zScore, absZ: Math.abs(zScore) };
  }

  private classifySeverity(absZ: number): AnomalyResult['severity'] {
    if (absZ > Z_AUTO_STOP_THRESHOLD) return 'AUTO_STOP';
    if (absZ > Z_THRESHOLD) return 'ALERT';
    return 'NORMAL';
  }

  private async handleSeverityAction(
    severity: AnomalyResult['severity'],
    machineId: string,
    value: number,
    zScore: number,
  ): Promise<void> {
    if (severity === 'AUTO_STOP') {
      await this.handleAutoStop(machineId, value, zScore);
    } else if (severity === 'ALERT') {
      this.handleAlert(machineId, value, zScore);
    }
  }

  private async handleAutoStop(machineId: string, value: number, zScore: number): Promise<void> {
    const reason = `Z=${zScore.toFixed(2)}, value=${value}`;
    this.stoppedMachines.set(machineId, { stoppedAt: new Date(), reason });
    this.logger.error({ msg: 'Mashina avto-to\'xtatish', machineId, zScore, value });
    this.events.emit('mes.machine.emergency_stop', { machineId, reason, timestamp: new Date() });
    // Audit 2026-08-07: bu yerda 'mes_work_orders' jadvaliga UPDATE bor edi — bunday jadval
    // bazada YO'Q, ya'ni so'rov HAR SAFAR yiqilardi va avto-to'xtatish holati faqat yuqoridagi
    // xotiradagi 'stoppedMachines' Map'da qolardi (server qayta ishga tushsa yo'qoladi).
    //
    // Uni boshqa jadvalga ko'chirib bo'lmadi (Q-29 tekshiruvi):
    //   * production_orders / production_order_operations da 'machine_id', 'paused_at',
    //     'pause_reason' ustunlarining BIRORTASI yo'q;
    //   * downtime_events 'session_id' NOT NULL talab qiladi — bu yerda sessiya ma'lum emas,
    //     ustiga uning 'work_center_id' ustuni uuid, qolgan sxemada esa integer.
    // Ya'ni mos keladigan saqlash joyi umuman mavjud emas -> yangi ustun/jadval kerak, bu esa
    // Q-35 (egasi ruxsati). Kafolatlangan yiqiladigan so'rovni saqlab qo'yish Q-46 buzilishi
    // bo'lardi, shuning uchun olib tashlandi va o'rniga aniq ogohlantirish yoziladi.
    //
    // Hozircha ishlaydigan qism: 'mes.machine.emergency_stop' hodisasi yuqorida chiqarildi va
    // xotiradagi holat yangilandi — ya'ni tinglovchilar ishlaydi, faqat DAVOMLI saqlash yo'q.
    this.logger.warn({
      msg: "Avto-to'xtatish DAVOMLI saqlanmadi — MES ish-buyurtmasi uchun pauza ustunlari sxemada yo'q (Q-35: egasi qarori kerak)",
      machineId,
      reason,
    });
  }

  private handleAlert(machineId: string, value: number, zScore: number): void {
    this.logger.warn({ msg: 'MES anomaly ALERT — HITL escalation required', machineId, zScore, value });
    this.events.emit('mes.machine.anomaly_alert', {
      machineId, zScore, value, absZ: Math.abs(zScore), timestamp: new Date(),
    });
  }

  private async logAnomalyDecision(
    machineId: string,
    workOrderId: string,
    canonicalInput: unknown,
    severity: AnomalyResult['severity'],
    zScore: number,
    isAnomaly: boolean,
    absZ: number,
    start: number,
  ): Promise<void> {
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
}
