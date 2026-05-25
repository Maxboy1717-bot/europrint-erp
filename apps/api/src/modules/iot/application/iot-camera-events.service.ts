/**
 * @module iot-camera-events.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { IOT_CAMERA_EVENTS_REPO, type IIotCameraEventsRepo } from '../domain/repositories/i-iot-camera-events.repo';

@Injectable()
export class IotCameraEventsService {
  constructor(@Inject(IOT_CAMERA_EVENTS_REPO) private readonly repo: IIotCameraEventsRepo) {}

  async listCameraEvents(cameraId?: string, type?: string, lim = 50): Promise<Result<object, AppError>> {
    return this.repo.listCameraEvents(cameraId, type, lim);
  }

  async createCameraEvent(camera_id: number, event_type: string, description: string | null, severity: string, zone_id: number | null) {
    return this.repo.createCameraEvent(camera_id, event_type, description, severity, zone_id);
  }

  async updateCameraEvent(id: number, status: string | null, resolution_note: string | null) {
    return this.repo.updateCameraEvent(id, status, resolution_note);
  }

  async listSafetyViolations(cameraId?: string, status?: string, lim = 50) {
    return this.repo.listSafetyViolations(cameraId, status, lim);
  }

  async createSafetyViolation(camera_id: number, violation_type: string, severity: string, description: string | null, employee_id: number | null) {
    return this.repo.createSafetyViolation(camera_id, violation_type, severity, description, employee_id);
  }

  async listQualityDefects(cameraId?: string, status?: string) {
    return this.repo.listQualityDefects(cameraId, status);
  }

  async createQualityDefect(camera_id: number, defect_type: string, severity: string, description: string | null) {
    return this.repo.createQualityDefect(camera_id, defect_type, severity, description);
  }

  async updateQualityDefect(id: number, status: string | null, resolution: string | null) {
    return this.repo.updateQualityDefect(id, status, resolution);
  }
}
