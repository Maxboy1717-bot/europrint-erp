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
