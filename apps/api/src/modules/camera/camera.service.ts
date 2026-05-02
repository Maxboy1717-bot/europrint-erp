import { Injectable, Logger } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { CameraRepository } from './camera.repo';

@Injectable()
export class CameraService {
  private readonly logger = new Logger(CameraService.name);

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

  constructor(private readonly repo: CameraRepository) {}
}
