import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { ErpCameraRepository } from './erp-camera.repository';

@Injectable()
export class ErpCameraService {
  constructor(private readonly repo: ErpCameraRepository) {}

  async cameraEmployeeReports(page: number, limit: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const itemsR = await this.repo.cameraEmployeeReports(limit, (page - 1) * limit);
      const items = (itemsR.ok ? itemsR.data as Record<string, unknown>[] : []);
      if (items.length > 0) return items;
      return this.repo.cameraFallbackReports(limit);
    });
  }

  async cameraEmployeeReport(userId: number, page: number, limit: number) {
    return safeCall(async () => {
      const itemsR = await this.repo.cameraEmployeeReport(userId, limit, (page - 1) * limit);
      const items = (itemsR.ok ? itemsR.data as Record<string, unknown>[] : []);
      if (items.length > 0) return items;
      return this.repo.cameraEmployeeFallback(userId, limit);
    });
  }

  async liveDetections(cameraId?: number) {
    return this.repo.liveDetections(cameraId);
  }

  async groupedDetections() {
    return this.repo.groupedDetections();
  }

  async teamAnalyticsDepartments() {
    return this.repo.teamAnalyticsDepartments();
  }

  async teamAnalyticsZoneActivity(departmentId?: number, period = '7d') {
    const interval = period === '30d' ? '30 days' : period === '24h' ? '1 day' : '7 days';
    return this.repo.teamAnalyticsZoneActivity(departmentId, interval);
  }

  async getEmployeeMetrics(userId: number) {
    return this.repo.getEmployeeMetrics(userId);
  }

  async getEmployeeTransferHistory(userId: number) {
    return this.repo.getEmployeeTransferHistory(userId);
  }
}
