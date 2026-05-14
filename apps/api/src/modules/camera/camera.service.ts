/**
 * @module camera.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Result, AppError, safeCall } from '@common/result';
import { CameraRepository } from './camera.repo';

@Injectable()
export class CameraService {
  private readonly logger = new Logger(CameraService.name);

  @OnEvent('employee.created')
  async onEmployeeCreated(payload: { employeeId: number; photoUrl?: string }) {
    const r = await this.repo.enrollFacePlaceholder(payload.employeeId, payload.photoUrl ?? null);
    if (!r.ok) this.logger.warn(`Face enrollment placeholder failed for employee #${payload.employeeId}: ${r.error}`);
    else this.logger.log(`Face enrollment placeholder created for employee #${payload.employeeId}`);
  }

  async getCameras(isActive?: boolean): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.findCameras(isActive);
      if (!r.ok) { this.logger.error('getCameras failed', r.error); return { items: [], total: 0 }; }
      return { items: r.data, total: r.data.length };
    });
  }

  async getDashboard() {
    const r = await this.repo.getDashboardStats();
    if (!r.ok) {
      this.logger.error('getDashboard failed', r.error);
      return { activeCameras: 0, offlineCameras: 0, openEvents: 0, highSeverity: 0, totalZones: 0 };
    }
    const d = r.data;
    return {
      activeCameras:  Number(d['active_cameras'])  || 0,
      offlineCameras: Number(d['offline_cameras'])  || 0,
      openEvents:     Number(d['open_events'])      || 0,
      highSeverity:   Number(d['high_severity'])    || 0,
      totalZones:     Number(d['total_zones'])      || 0,
    };
  }

  async getEvents(cameraId?: string, severity?: string, limit = 50, offset = 0) {
    const r = await this.repo.findEvents(cameraId, severity, limit, offset);
    if (!r.ok) { this.logger.error('getEvents failed', r.error); return { items: [], total: 0 }; }
    return { items: r.data, total: r.data.length };
  }

  async getZones() {
    const r = await this.repo.findZones();
    if (!r.ok) { this.logger.error('getZones failed', r.error); return { items: [], total: 0 }; }
    return { items: r.data, total: r.data.length };
  }

  async getAlerts(status?: string, limit = 50, offset = 0) {
    const r = await this.repo.findAlerts(status, limit, offset);
    if (!r.ok) { this.logger.error('getAlerts failed', r.error); return { items: [], total: 0 }; }
    return { items: r.data, total: r.data.length };
  }

  async autoDisciplineFromViolation(violationId: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const vr = await this.repo.getViolationById(violationId);
      if (!vr.ok || !vr.data?.length) throw new Error(`Violation #${violationId} topilmadi`);
      const v = vr.data[0] as Record<string, unknown>;
      const empId = v['employee_id'] ? parseInt(String(v['employee_id']), 10) : null;
      if (!empId) return { skipped: true, reason: 'employee_id mavjud emas' };
      const violationDate = v['detected_at']
        ? new Date(v['detected_at'] as string).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      const dr = await this.repo.createDisciplineDraft(
        empId,
        String(v['violation_type'] ?? 'camera_violation'),
        String(v['severity'] ?? 'medium'),
        String(v['description'] ?? `Camera violation #${violationId}`),
        violationDate,
      );
      if (!dr.ok) throw new Error(String(dr.error));
      return { created: true, disciplineRecord: dr.data?.[0] ?? null, fromViolation: violationId };
    });
  }

  constructor(private readonly repo: CameraRepository) {}
}
