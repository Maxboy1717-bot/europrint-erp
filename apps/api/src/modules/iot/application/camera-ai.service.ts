/**
 * @module camera-ai.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Ok, Err, Result, isErr } from '@common/result';
import { DrizzleCameraAiRepo } from '../infrastructure/repositories/drizzle-camera-ai.repo';
import { AiRouterService } from '../../ai/application/services/ai-router.service';
import { CreateNotificationCommand } from '../../notifications/application/commands/create-notification.command';
import {
  CAMERA_VISION_MAX_TOKENS,
  CAMERA_VISION_DEFAULT_CONFIDENCE,
} from '@common/constants/business.constants';

/** Bildirishnoma yuboriladigan severity darajalar — past/o'rta darajalarda shovqin oshirilmaydi. */
const CAMERA_ALERT_NOTIFY_SEVERITIES = new Set(['high', 'critical']);

/** Standard mission catalog mirrored from FE `camera-ai-modern/taskCatalog.ts` (AI_TASK_CATALOG ids). */
const DEFAULT_MISSION_HINTS: Record<string, string> = {
  perimeter_line: 'Perimetr/zona chizig\'idan ruxsatsiz o\'tish yoki chegara buzilishi',
  access_control_visual: 'Kirish punkti (turniket/eshik) da qoidabuzarlik',
  safety_ppe: 'Kaska, ko\'zoynak yoki qo\'lqop kabi maxsus kiyim (PPE) kiyilmagani',
  face_attendance: 'Davomat uchun yuzni aniqlash (ruxsatli xodimmi)',
  behavior_anomaly: 'Shubhali harakat: uzoq turish, yugurish, to\'planish',
  quality_visual: 'Mahsulotda vizual nuqson yoki noto\'g\'ri qatlam',
  productivity_line: 'Liniya faolligi: bo\'sh turish yoki ishdan chalg\'ish',
  machine_state_visual: 'Uskuna holati: ishlamoqda yoki to\'xtagan',
  tamper_camera: 'Kameraga aralashuv: qoplash yoki yo\'naltirishni o\'zgartirish',
  crowd_density: 'Odamlar zichligi va tirbandlik xavfi',
};

export interface CameraVisionFinding {
  mission: string;
  detected: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
}

export interface AnalyzeMissionsResult {
  cameraId: string;
  executedLanes: string[];
  findings: CameraVisionFinding[];
  provider: string;
  model: string;
  persisted: boolean;
  persistedEventIds: number[];
}

@Injectable()
export class CameraAiService {
  private readonly logger = new Logger(CameraAiService.name);

  constructor(
    private readonly repo: DrizzleCameraAiRepo,
    private readonly aiRouter: AiRouterService,
    private readonly commandBus: CommandBus,
  ) {}

  getSummary(): ReturnType<DrizzleCameraAiRepo['findSummary']> {
    return this.repo.findSummary();
  }

  getSafetyTrends(days: number): ReturnType<DrizzleCameraAiRepo['findSafetyTrends']> {
    return this.repo.findSafetyTrends(days);
  }

  getQualityAnalysis(): ReturnType<DrizzleCameraAiRepo['findQualityAnalysis']> {
    return this.repo.findQualityAnalysis();
  }

  getProductivityScores(): ReturnType<DrizzleCameraAiRepo['findProductivityScores']> {
    return this.repo.findProductivityScores();
  }

  getMachineUtilization(): ReturnType<DrizzleCameraAiRepo['findMachineUtilization']> {
    return this.repo.findMachineUtilization();
  }

  getAnomalyDetection(): ReturnType<DrizzleCameraAiRepo['findAnomalyDetection']> {
    return this.repo.findAnomalyDetection();
  }

  listCamerasAi(): ReturnType<DrizzleCameraAiRepo['listActiveCameras']> {
    return this.repo.listActiveCameras();
  }

  getCameraTriggerRules(id: string): ReturnType<DrizzleCameraAiRepo['findCameraConfig']> {
    return this.repo.findCameraConfig(id);
  }

  async updateCameraPrompt(
    id: string,
    prompt: string,
    zone: string,
    alertThreshold: number,
    isActive: boolean,
    triggerRules: unknown[],
  ): Promise<Result<{ cameraId: string; prompt: string; zone: string; alertThreshold: number; isActive: boolean }>> {
    const configResult = await this.repo.findCameraConfig(id);
    if (!configResult.ok) return Err(configResult.error);
    const promptConfig = JSON.stringify({ ai_prompt: prompt, rules: triggerRules });
    const upsertResult = await this.repo.upsertCameraConfig(
      id, String(configResult.data.cameraName ?? ''), promptConfig, zone, alertThreshold, isActive,
    );
    if (!upsertResult.ok) return Err(upsertResult.error);
    return Ok({ cameraId: id, prompt, zone, alertThreshold, isActive });
  }

  async updateCameraTriggerRulesFromBody(
    id: string,
    triggerRules: unknown[],
    zone: string,
    alertThreshold: number,
    isActive: boolean,
  ): Promise<Result<{ cameraId: string; triggerRules: unknown[] }>> {
    const configResult = await this.repo.findCameraConfig(id);
    if (!configResult.ok) return Err(configResult.error);
    const rulesJson = JSON.stringify(triggerRules);
    const upsertResult = await this.repo.upsertCameraConfig(
      id, String(configResult.data.cameraName ?? ''), rulesJson, zone, alertThreshold, isActive,
    );
    if (!upsertResult.ok) return Err(upsertResult.error);
    return Ok({ cameraId: id, triggerRules });
  }

  /**
   * 2.11 — real VLM (vision-capable LLM, via AiRouterService) frame analysis
   * for the "Tahlil laboratoriyasi" (CameraAnalysisWorkbench.tsx). Replaces
   * the previous fake echo (returned `getDashboard()` snapshot regardless of
   * the uploaded image — Q-40 violation).
   *
   * Missions: resolved from the camera's stored trigger-rules config when it
   * contains recognizable mission ids (`camera_ai_configs.detection_types`);
   * otherwise falls back to the full standard catalog (`DEFAULT_MISSION_HINTS`)
   * so the analysis is still real and camera-agnostic rather than skipped.
   * (Mission-editor persistence itself is a separate, larger gap — tracked
   * out of this task's scope, see `patchCameraAi` stub note.)
   */
  async analyzeByMissions(input: {
    cameraId: string;
    imageBase64: string;
    mediaType: string;
    persist: boolean;
  }): Promise<Result<AnalyzeMissionsResult>> {
    const configResult = await this.repo.findCameraConfig(input.cameraId);
    if (!configResult.ok) return Err(configResult.error);

    const missions = this.resolveMissions(configResult.data.triggerRules);
    const prompt = this.buildVisionPrompt(missions);

    const aiResult = await this.aiRouter.call({
      taskType: 'iot.camera_vision_analyze',
      prompt,
      systemPrompt:
        'Siz ishlab chiqarish sexi xavfsizligi/sifat nazorati bo\'yicha AI kamera tahlilchisisiz. '
        + 'Faqat berilgan kadrda haqiqatan ko\'ringan narsalarni tasvirlang. Faqat JSON massiv qaytaring.',
      maxTokens: CAMERA_VISION_MAX_TOKENS,
      image: { base64: input.imageBase64, mediaType: input.mediaType },
    });
    if (isErr(aiResult)) return Err(aiResult.error);

    const findings = this.parseFindings(aiResult.data.text, missions);
    const persistedEventIds: number[] = [];
    if (input.persist) {
      for (const finding of findings.filter((f) => f.detected)) {
        const createResult = await this.repo.createCameraEvent({
          cameraId: input.cameraId,
          eventType: finding.mission,
          description: finding.description,
          severity: finding.severity,
          aiConfidence: finding.confidence,
        });
        if (createResult.ok) {
          persistedEventIds.push(createResult.data.id);
          // Item #85: without this, AI findings never reached camera_alerts —
          // the human-confirm (acknowledge/resolve) UI stayed permanently empty.
          const alertResult = await this.repo.createCameraAlert({
            cameraId: input.cameraId,
            cameraEventId: createResult.data.id,
            alertType: finding.mission,
            severity: finding.severity,
            title: DEFAULT_MISSION_HINTS[finding.mission] ?? finding.mission,
            message: finding.description,
          });
          if (!alertResult.ok) {
            this.logger.warn(`analyzeByMissions: camera_alerts insert xato — ${alertResult.error.message}`);
          } else if (CAMERA_ALERT_NOTIFY_SEVERITIES.has(finding.severity)) {
            void this._notifyAlertRecipients(input.cameraId, finding, alertResult.data.id);
          }
        } else {
          this.logger.warn(`analyzeByMissions: camera_events insert xato — ${createResult.error.message}`);
        }
      }
    }

    return Ok({
      cameraId: input.cameraId,
      executedLanes: missions,
      findings,
      provider: aiResult.data.provider,
      model: aiResult.data.model,
      persisted: input.persist,
      persistedEventIds,
    });
  }

  /**
   * Audit 2026-08-08: camera_alerts had a real writer (createCameraAlert, above)
   * but zero notification recipients — SECURITY/HR staff only ever saw a high/
   * critical camera finding if they happened to open the alerts page. Best-effort
   * (own try/catch) — a notification failure must never fail the already-persisted
   * alert write, matching territory.gateway.ts's _notifyPersistent precedent.
   */
  private async _notifyAlertRecipients(
    cameraId: string,
    finding: CameraVisionFinding,
    alertId: number,
  ): Promise<void> {
    try {
      const recipientsResult = await this.repo.findAlertNotifyUserIds();
      if (!recipientsResult.ok) {
        this.logger.warn(`_notifyAlertRecipients: recipient qidiruv xato — ${recipientsResult.error}`);
        return;
      }
      const title = DEFAULT_MISSION_HINTS[finding.mission] ?? finding.mission;
      const body = `Kamera ${cameraId}: ${finding.description} (${finding.severity})`;
      for (const userId of recipientsResult.data) {
        await this.commandBus.execute(
          new CreateNotificationCommand(String(userId), title, body, 'camera_alert', String(alertId), 'camera_alert'),
        ).catch((err: unknown) => {
          this.logger.warn(`_notifyAlertRecipients: notification failed userId=${userId}: ${String(err)}`);
        });
      }
    } catch (err: unknown) {
      this.logger.warn(`_notifyAlertRecipients failed: ${String(err)}`);
    }
  }

  private resolveMissions(triggerRules: Record<string, unknown>[]): string[] {
    const fromConfig = triggerRules
      .flatMap((rule) => {
        if (typeof rule === 'string') return [rule];
        if (rule && typeof rule === 'object' && 'id' in rule && typeof rule.id === 'string') return [rule.id];
        return [];
      })
      .filter((id) => id in DEFAULT_MISSION_HINTS);
    return fromConfig.length > 0 ? fromConfig : Object.keys(DEFAULT_MISSION_HINTS);
  }

  private buildVisionPrompt(missions: string[]): string {
    const lines = missions.map((m) => `- ${m}: ${DEFAULT_MISSION_HINTS[m] ?? m}`).join('\n');
    return (
      'Quyidagi kadrni tahlil qiling va faqat quyidagi topshiriqlar bo\'yicha aniqlangan holatlarni qaytaring:\n'
      + `${lines}\n\n`
      + 'Javobni FAQAT quyidagi JSON massiv shaklida bering (boshqa matn yo\'q):\n'
      + '[{"mission": "<id>", "detected": true|false, "severity": "low"|"medium"|"high"|"critical", '
      + '"confidence": 0.0-1.0, "description": "<qisqa tavsif>"}]'
    );
  }

  private parseFindings(rawText: string, missions: string[]): CameraVisionFinding[] {
    const fallback = (): CameraVisionFinding[] => [{
      mission: missions[0] ?? 'unknown',
      detected: false,
      severity: 'low',
      confidence: CAMERA_VISION_DEFAULT_CONFIDENCE,
      description: rawText.slice(0, 500),
    }];
    try {
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return fallback();
      const parsed: unknown = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) return fallback();
      const rows = parsed
        .filter((row): row is Record<string, unknown> => row !== null && typeof row === 'object')
        .map((row) => this.toFinding(row));
      return rows.length > 0 ? rows : fallback();
    } catch (e) {
      this.logger.warn(`analyzeByMissions: VLM JSON parse xato — ${(e as Error).message}`);
      return fallback();
    }
  }

  private toFinding(row: Record<string, unknown>): CameraVisionFinding {
    const severity = typeof row.severity === 'string' && ['low', 'medium', 'high', 'critical'].includes(row.severity)
      ? row.severity as CameraVisionFinding['severity']
      : 'low';
    const confidence = typeof row.confidence === 'number'
      ? Math.min(Math.max(row.confidence, 0), 1)
      : CAMERA_VISION_DEFAULT_CONFIDENCE;
    return {
      mission: typeof row.mission === 'string' ? row.mission : 'unknown',
      detected: row.detected === true,
      severity,
      confidence,
      description: typeof row.description === 'string' ? row.description : '',
    };
  }
}
