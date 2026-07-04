/**
 * AGENT 12: IoT/Kamera — sensor + anomaliya + RUL
 *
 * Q29 (2026-07-04): Ilgari bu servis hardcoded qiymatlar qaytargan (vibration=1.2,
 * temp=65.5, daysLeft=60) — machineId'dan qat'i nazar hech qachon o'zgarmagan,
 * shuning uchun anomaliya-aniqlash hech qachon ishga tushmagan. Endi haqiqiy
 * IoT telemetriya yo'liga ulangan: `iot_sensors` / `iot_sensor_readings`
 * (SENSOR_REPO — modules/iot/infrastructure/repositories/drizzle-sensor.repo.ts)
 * + PredictiveMaintenanceService (least-squares RUL, modules/iot/oee/).
 */

/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM query builder cannot
 *   express: target table `hr_ai_attendance` is not in the Drizzle schema
 *   barrel, and the INSERT uses `NOW()` server-side timestamp expression for
 *   captured_at rather than a JS-side Date value.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { isErr } from '@common/result';
import { AgentAlertService } from './shared/agent-alert.service';
import { AgentAuditService } from './shared/agent-audit.service';
import { AgentEventBusService } from './shared/agent-event-bus.service';
import { ISensorRepo, SENSOR_REPO } from '../iot/domain/repositories/i-sensor.repo';
import { PredictiveMaintenanceService } from '../iot/oee/predictive-maintenance.service';

/** Sensordan tarixiy o'qishlar yetarli bo'lmasa ham RUL/soglik holatini baholash uchun minimal deraza. */
const RUL_READING_WINDOW = 50;

@Injectable()
export class IotAgentService {
  private readonly logger = new Logger(IotAgentService.name);
  private readonly AGENT  = 'iot';
  // Pure-compute domain service (no DB/IO) — mahalliy instansiya, cross-module
  // export shart emas (PredictiveMaintenanceService IotModule'da export qilinmagan).
  private readonly pdm = new PredictiveMaintenanceService();

  constructor(
    private readonly alert: AgentAlertService,
    private readonly audit: AgentAuditService,
    private readonly bus:   AgentEventBusService,
    @Inject(SENSOR_REPO) private readonly sensorRepo: ISensorRepo,
  ) {}

  /** Sensorning eng so'nggi haqiqiy o'qishi (iot_sensors + iot_sensor_readings). */
  async collectSensorData(machineId: string): Promise<{ vibration: number; temp: number; current: number; timestamp: string }> {
    const deviceResult = await this.sensorRepo.findDeviceById(machineId);
    if (isErr(deviceResult)) {
      throw new NotFoundException(`Sensor qurilma topilmadi: ${machineId}`);
    }
    const readingsResult = await this.sensorRepo.findReadings(machineId, { limit: 1 });
    if (isErr(readingsResult) || readingsResult.data.length === 0) {
      throw new NotFoundException(`Sensor #${machineId} uchun o'qish ma'lumoti topilmadi`);
    }
    const latest = readingsResult.data[0];
    // Kanonik sxema bitta `value` ustuniga ega (vibration/temp/current alohida
    // ustunlar emas) — device.type orqali qaysi metrikaga tegishli ekani aniqlanadi,
    // qolganlari shu sensor uchun mavjud emasligini bildirish uchun NaN emas, 0 emas —
    // aynan shu o'qish qiymatini tegishli maydonga qo'yamiz, boshqalari noma'lum (0).
    const device = deviceResult.data;
    const type = String(device.type ?? '').toLowerCase();
    const value = latest.value;
    return {
      vibration: type.includes('vibrat') ? value : 0,
      temp: type.includes('temp') ? value : 0,
      current: type.includes('current') || type.includes('amper') ? value : 0,
      timestamp: latest.timestamp.toISOString(),
    };
  }

  /** Anomaliya aniqlash — haqiqiy o'qish qiymati device threshold'lari bilan solishtiriladi. */
  async detectAnomalies(machineId: string): Promise<{ hasAnomaly: boolean; metric?: string; value?: number }> {
    const deviceResult = await this.sensorRepo.findDeviceById(machineId);
    if (isErr(deviceResult)) return { hasAnomaly: false };

    const readingsResult = await this.sensorRepo.findReadings(machineId, { limit: 1 });
    if (isErr(readingsResult) || readingsResult.data.length === 0) return { hasAnomaly: false };

    const latest = readingsResult.data[0];
    if (latest.isAnomaly) {
      const metric = String(deviceResult.data.type ?? 'value');
      this.bus.emit('iot.anomaly', { machineId, metric, value: latest.value }, this.AGENT);
      return { hasAnomaly: true, metric, value: latest.value };
    }
    return { hasAnomaly: false };
  }

  /** RUL — Remaining Useful Life, haqiqiy o'qishlar tarixi ustidan least-squares trend. */
  async predictFailure(machineId: string): Promise<{ daysLeft: number; confidence: number }> {
    const deviceResult = await this.sensorRepo.findDeviceById(machineId);
    if (isErr(deviceResult)) {
      throw new NotFoundException(`Sensor qurilma topilmadi: ${machineId}`);
    }
    const device = deviceResult.data;
    const baseline = device.thresholds?.min;
    const failureThreshold = device.thresholds?.max;
    if (baseline === undefined || failureThreshold === undefined || baseline === failureThreshold) {
      // Threshold o'rnatilmagan — soxta ishonch qaytarmaslik uchun "ma'lumot yetarli emas" holati.
      return { daysLeft: 0, confidence: 0 };
    }

    const readingsResult = await this.sensorRepo.findReadings(machineId, { limit: RUL_READING_WINDOW });
    if (isErr(readingsResult)) {
      return { daysLeft: 0, confidence: 0 };
    }

    const calcResult = await this.pdm.calculate({
      baseline,
      failureThreshold,
      lookaheadHours: 24 * 30,
      readings: readingsResult.data.map(r => ({ value: r.value, recordedAt: r.timestamp })),
    });
    if (isErr(calcResult)) {
      return { daysLeft: 0, confidence: 0 };
    }

    const pdmResult = calcResult.data;
    if (!pdmResult.hasEnoughData || pdmResult.remainingUsefulLifeHours === null) {
      return { daysLeft: 0, confidence: 0 };
    }
    return {
      daysLeft: Math.round(pdmResult.remainingUsefulLifeHours / 24),
      confidence: Math.round((1 - pdmResult.failureProbability) * 100) / 100,
    };
  }

  /** Yuz aniqlash davomat (HR_AI_ATTENDANCE bilan integratsiya) */
  async faceRecognitionAttendance(userId: number, cameraId: string, location: string, confidence: number): Promise<void> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'face_recognition', userId, targetType: 'camera', targetId: cameraId }, async () => {
      await runQuery(sql`
        INSERT INTO hr_ai_attendance (user_id, event_type, camera_id, location, captured_at, face_confidence)
        VALUES (${userId}, 'territory_in', ${cameraId}, ${location}, NOW(), ${confidence})
      `);
    });
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async cron(): Promise<void> {
    const devicesResult = await this.sensorRepo.findAllDevices({ status: 'active', limit: 100 });
    if (isErr(devicesResult)) return;
    for (const device of devicesResult.data.items) {
      try {
        const a = await this.detectAnomalies(device.id);
        if (a.hasAnomaly) {
          await this.alert.send({
            agentName: this.AGENT, severity: 'warning', module: 'iot',
            title: `Mashina anomaliyasi: ${device.name}`, message: `${a.metric} = ${a.value}`,
            targetRole: 'prod_head',
          });
        }
      } catch { /* noop */ }
    }
  }
}
