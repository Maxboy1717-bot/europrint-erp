/**
 * AGENT 12: IoT/Kamera — sensor + anomaliya + RUL
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { AgentAlertService } from './shared/agent-alert.service';
import { AgentAuditService } from './shared/agent-audit.service';
import { AgentEventBusService } from './shared/agent-event-bus.service';

@Injectable()
export class IotAgentService {
  private readonly logger = new Logger(IotAgentService.name);
  private readonly AGENT  = 'iot';

  constructor(
    private readonly alert: AgentAlertService,
    private readonly audit: AgentAuditService,
    private readonly bus:   AgentEventBusService,
  ) {}

  /** Sensor ma'lumotlari (placeholder — InfluxDB integratsiya kelajakda) */
  async collectSensorData(machineId: string): Promise<{ vibration: number; temp: number; current: number; timestamp: string }> {
    // Placeholder simulated values
    return { vibration: 1.2, temp: 65.5, current: 12.3, timestamp: new Date().toISOString() };
  }

  /** Anomaliya aniqlash (3 sigma rule placeholder) */
  async detectAnomalies(machineId: string): Promise<{ hasAnomaly: boolean; metric?: string; value?: number }> {
    const data = await this.collectSensorData(machineId);
    if (data.vibration > 5.0) {
      this.bus.emit('iot.anomaly', { machineId, metric: 'vibration', value: data.vibration }, this.AGENT);
      return { hasAnomaly: true, metric: 'vibration', value: data.vibration };
    }
    if (data.temp > 95) {
      this.bus.emit('iot.anomaly', { machineId, metric: 'temperature', value: data.temp }, this.AGENT);
      return { hasAnomaly: true, metric: 'temperature', value: data.temp };
    }
    return { hasAnomaly: false };
  }

  /** RUL — Remaining Useful Life (placeholder) */
  async predictFailure(machineId: string): Promise<{ daysLeft: number; confidence: number }> {
    return { daysLeft: 60, confidence: 0.85 };
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
    // Active machines list — placeholder
    const machines = ['MACHINE_001', 'MACHINE_002'];
    for (const m of machines) {
      try {
        const a = await this.detectAnomalies(m);
        if (a.hasAnomaly) {
          await this.alert.send({
            agentName: this.AGENT, severity: 'warning', module: 'iot',
            title: `Mashina anomaliyasi: ${m}`, message: `${a.metric} = ${a.value}`,
            targetRole: 'prod_head',
          });
        }
      } catch { /* noop */ }
    }
  }
}
