/**
 * @module camera-extended.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { DrizzleCameraRepo } from '../infrastructure/repositories/drizzle-camera.repo';
import { DrizzleCameraAiRepo } from '../infrastructure/repositories/drizzle-camera-ai.repo';
import type {
  CameraGlobalSettingsBody,
  CreateCameraManagementBody,
  UpdateCameraManagementBody,
} from '../presentation/dto/iot-camera.dto';

type UpdateStatusData = { id: number; name: string | null; is_active: boolean };
type UpdateSettingsData = UpdateStatusData | { updated: true; settings: Record<string, unknown> };

/**
 * `aiSensitivity` (FE dropdown, `CameraAIModernHub.tsx`) -> `camera_ai_configs.alert_threshold`
 * (0-1 dan VLM ishonchlilik chegarasi). Past sezgirlik = yuqori chegara (faqat ishonchli
 * topilmalar); yuqori sezgirlik = past chegara (ko'proq topadi, yolg'on-musbat ham ko'proq).
 * `findCameraConfig`ning o'zi ishlatadigan default (0.8) — "medium" bilan bir xil.
 */
const SENSITIVITY_TO_THRESHOLD: Record<'low' | 'medium' | 'high', number> = {
  low: 0.9,
  medium: 0.8,
  high: 0.6,
};

@Injectable()
export class CameraExtendedService {
  constructor(
    private readonly repo: DrizzleCameraRepo,
    private readonly aiRepo: DrizzleCameraAiRepo,
  ) {}

  getRecognitionStats(): ReturnType<DrizzleCameraRepo['findRecognitionStats']> {
    return this.repo.findRecognitionStats();
  }

  getRecognitionLogs(
    limit: number,
    cameraId: string | undefined,
    flagged: string | undefined,
  ): ReturnType<DrizzleCameraRepo['findRecognitionLogs']> {
    return this.repo.findRecognitionLogs(limit, cameraId, flagged);
  }

  flagRecognitionLog(id: number): ReturnType<DrizzleCameraRepo['flagRecognitionLog']> {
    return this.repo.flagRecognitionLog(id);
  }

  unflagRecognitionLog(id: number): ReturnType<DrizzleCameraRepo['unflagRecognitionLog']> {
    return this.repo.unflagRecognitionLog(id);
  }

  getCameraAlerts(
    status: string | undefined,
    severity: string | undefined,
    limit: number,
  ): ReturnType<DrizzleCameraRepo['findCameraAlerts']> {
    return this.repo.findCameraAlerts(status, severity, limit);
  }

  acknowledgeCameraAlert(id: number): ReturnType<DrizzleCameraRepo['acknowledgeAlert']> {
    return this.repo.acknowledgeAlert(id);
  }

  resolveCameraAlert(
    id: number,
    notes: string | undefined,
  ): ReturnType<DrizzleCameraRepo['resolveAlert']> {
    return this.repo.resolveAlert(id, notes);
  }

  getCameraSettings(): ReturnType<DrizzleCameraRepo['findCameraSettings']> {
    return this.repo.findCameraSettings();
  }

  async updateCameraSettings(
    settings: Record<string, unknown>,
  ): Promise<Result<UpdateSettingsData>> {
    if (settings['camera_id']) {
      return this.repo.updateCameraStatus(
        Number(settings['camera_id']),
        String(settings['status'] ?? 'active'),
      );
    }
    return Promise.resolve(Ok({ updated: true as const, settings }));
  }

  listAllCameras(
    status: string | undefined,
    type: string | undefined,
  ): ReturnType<DrizzleCameraRepo['listCameras']> {
    return this.repo.listCameras(status, type);
  }

  getCameraById(id: number): ReturnType<DrizzleCameraRepo['findCameraById']> {
    return this.repo.findCameraById(id);
  }

  /**
   * Global camera AI/alert/telegram/penalty settings (Cameras Management →
   * camera-settings.tsx page). Backed by a singleton row in the generic
   * `settings` key-value table (Q-35 — no new table). Returns sane defaults
   * (matching the FE's initial state) when no row has been saved yet.
   */
  async getGlobalCameraSettings(): Promise<Result<CameraGlobalSettingsBody>> {
    const res = await this.repo.findGlobalCameraSettings();
    if (!res.ok) return res as Result<never>;
    const defaults: CameraGlobalSettingsBody = {
      safetyThreshold: 80,
      qualityThreshold: 75,
      productivityThreshold: 70,
      enableSafetyAlerts: true,
      enableQualityAlerts: true,
      enableMachineAlerts: true,
      enableProductivityAlerts: false,
      telegramEnabled: true,
      dailyReportTime: '18:00',
      alertCooldown: 5,
      autoPenalty: true,
      penaltyAmount: 50000,
    };
    return Ok({ ...defaults, ...(res.data ?? {}) });
  }

  async saveGlobalCameraSettings(
    dto: CameraGlobalSettingsBody,
  ): Promise<Result<CameraGlobalSettingsBody>> {
    return this.repo.saveGlobalCameraSettings(dto) as Promise<Result<CameraGlobalSettingsBody>>;
  }

  /** Cameras Management page (cameras-management.tsx) — real CRUD backed by the `cameras` table. */
  createCameraManagement(
    dto: CreateCameraManagementBody,
  ): ReturnType<DrizzleCameraRepo['createCameraManagement']> {
    return this.repo.createCameraManagement({
      code: dto.code,
      name: dto.name,
      nameRu: dto.nameRu ?? null,
      rtspUrl: dto.rtspUrl ?? null,
      ipAddress: dto.ipAddress ?? null,
      port: dto.port ?? null,
      workCenterId: dto.workCenterId ?? null,
      location: dto.location ?? null,
      isActive: dto.isActive,
    });
  }

  updateCameraManagement(
    id: number,
    dto: UpdateCameraManagementBody,
  ): ReturnType<DrizzleCameraRepo['updateCameraManagement']> {
    return this.repo.updateCameraManagement(id, {
      code: dto.code,
      name: dto.name,
      nameRu: dto.nameRu,
      rtspUrl: dto.rtspUrl,
      ipAddress: dto.ipAddress,
      port: dto.port,
      workCenterId: dto.workCenterId,
      location: dto.location,
      isActive: dto.isActive,
    });
  }

  deleteCameraManagement(id: number): ReturnType<DrizzleCameraRepo['deleteCameraManagement']> {
    return this.repo.deleteCameraManagement(id);
  }

  /**
   * Patch a camera's AI configuration (used by the modern camera-AI hub,
   * `CameraAIModernHub.tsx` "Missiya tahririchi" + AI-toggle switch).
   * Body shape: { aiCategories?: string[], aiPrompt?: string|null,
   *               aiSensitivity?: 'low'|'medium'|'high', aiEnabled?: boolean,
   *               isActive?: boolean }
   *
   * Audit 2026-08-07: this was `return Promise.resolve(Ok({ id, patched: body }))` — an echo
   * that never touched the database (Q-43: "ko'rinadi lekin saqlamaydi"). The FE showed a
   * "saved" toast and immediately lost the edit on refetch. The real write path
   * (`camera_ai_configs` upsert) already existed and is used correctly by the OTHER two
   * camera-AI settings screens (`CameraAIPrompts.tsx` -> `PUT .../prompt`,
   * `CameraTriggerRules.tsx` -> `PUT .../trigger-rules`, both via
   * `CameraAiService.updateCameraPrompt`/`updateCameraTriggerRulesFromBody`) — this endpoint
   * just never called it. Delegates to the same `upsertCameraConfig` repo method so all three
   * entry points converge on one row per camera, instead of three competing write paths.
   */
  async patchCameraAi(
    id: number,
    body: Record<string, unknown>,
  ): Promise<Result<{ id: number; patched: Record<string, unknown> }>> {
    const configResult = await this.aiRepo.findCameraConfig(String(id));
    if (!configResult.ok) return Err(configResult.error);
    const current = configResult.data;

    const aiCategories = Array.isArray(body['aiCategories']) ? (body['aiCategories'] as unknown[]) : undefined;
    const triggerRules = aiCategories ?? current.triggerRules ?? [];
    const aiPrompt = typeof body['aiPrompt'] === 'string' ? (body['aiPrompt'] as string) : current.aiPrompt;
    // `camera_ai_configs.ai_prompt` has no dedicated Drizzle column to write through (schema
    // drift, see findCameraConfig comment) — `detection_types` carries `{ai_prompt, rules}`
    // whenever a prompt exists, matching the format `updateCameraPrompt`/`CameraAIPrompts.tsx`
    // already write and `findCameraConfig` already parses. Plain array when there is no prompt.
    const detectionTypes = JSON.stringify(aiPrompt ? { ai_prompt: aiPrompt, rules: triggerRules } : triggerRules);

    const sensitivity = body['aiSensitivity'] as 'low' | 'medium' | 'high' | undefined;
    const alertThreshold = sensitivity
      ? SENSITIVITY_TO_THRESHOLD[sensitivity]
      : Number(current.alertThreshold ?? SENSITIVITY_TO_THRESHOLD.medium);

    const zone = typeof body['zone'] === 'string' ? (body['zone'] as string) : (current.zone ?? '');
    // aiEnabled = shu ekrandagi asosiy yoqish/o'chirish kaliti (toggleAiMutation faqat shuni
    // yuboradi); isActive — kamera boshqaruv sahifasidan kelishi mumkin bo'lgan muqobil nom.
    const isActive = (body['aiEnabled'] as boolean | undefined) ?? (body['isActive'] as boolean | undefined) ?? current.isActive ?? true;

    const upsertResult = await this.aiRepo.upsertCameraConfig(
      String(id), String(current.cameraName ?? ''), detectionTypes, zone, alertThreshold, isActive,
    );
    if (!upsertResult.ok) return Err(upsertResult.error);

    return Ok({ id, patched: body });
  }

  getQualityDefectsCamera(
    status: string | undefined,
    cameraId: string | undefined,
    defectType: string | undefined,
    limit: number,
  ): ReturnType<DrizzleCameraRepo['findQualityDefects']> {
    return this.repo.findQualityDefects(status, cameraId, defectType, limit);
  }

  getCameraEmployeeRatings(
    limit: number,
    employeeId: string | undefined,
  ): ReturnType<DrizzleCameraRepo['findEmployeeRatings']> {
    return this.repo.findEmployeeRatings(limit, employeeId);
  }
}
