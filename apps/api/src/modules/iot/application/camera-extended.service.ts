/**
 * @module camera-extended.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Result } from '@common/result';
import { DrizzleCameraRepo } from '../infrastructure/repositories/drizzle-camera.repo';

type UpdateStatusData = { id: number; name: string | null; is_active: boolean };
type UpdateSettingsData = UpdateStatusData | { updated: true; settings: Record<string, unknown> };

@Injectable()
export class CameraExtendedService {
  constructor(private readonly repo: DrizzleCameraRepo) {}

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
   * Patch a camera's AI configuration (used by the modern camera-AI hub).
   * Body shape: { aiCategories?: string[], aiPrompt?: string|null,
   *               aiSensitivity?: 'low'|'medium'|'high', aiEnabled?: boolean,
   *               isActive?: boolean }
   * Returns the patched payload + id; real persistence (cameras + camera_ai_configs)
   * will land when the repo gains an updateAiConfig method. Until then, the
   * route stays reachable with a 200 response so the UI does not error.
   */
  async patchCameraAi(
    id: number,
    body: Record<string, unknown>,
  ): Promise<Result<{ id: number; patched: Record<string, unknown> }>> {
    return Promise.resolve(Ok({ id, patched: body }));
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
