import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { DrizzleCameraDashboardRepo } from '../infrastructure/repositories/drizzle-camera-dashboard.repo';

import { MS_PER_DAY } from '@common/constants/app.constants';
type TopEmployeeData = Extract<
  Awaited<ReturnType<DrizzleCameraDashboardRepo['findTopEmployees']>>,
  { ok: true; data: unknown }
>['data'];
type ReportData = Extract<
  Awaited<ReturnType<DrizzleCameraDashboardRepo['generateReport']>>,
  { ok: true; data: unknown }
>['data'];

@Injectable()
export class CameraDashboardService {
  constructor(private readonly repo: DrizzleCameraDashboardRepo) {}

  getStats(): ReturnType<DrizzleCameraDashboardRepo['findStats']> {
    return this.repo.findStats();
  }

  getPendingAlerts(limit: number): ReturnType<DrizzleCameraDashboardRepo['findPendingAlerts']> {
    return this.repo.findPendingAlerts(limit);
  }

  getRecentEvents(
    limit: number,
    type: string | undefined,
  ): ReturnType<DrizzleCameraDashboardRepo['findRecentEvents']> {
    return this.repo.findRecentEvents(limit, type);
  }

  async getTopEmployees(
    limit: number,
    metric?: string,
  ): Promise<Result<{ metric: string; employees: TopEmployeeData }>> {
    const r = await this.repo.findTopEmployees(limit);
    return r.ok ? Ok({ metric: metric ?? 'productivity', employees: r.data }) : Err(r.error);
  }

  getQualityStats(): ReturnType<DrizzleCameraDashboardRepo['findQualityStats']> {
    return this.repo.findQualityStats();
  }

  getAttendanceStats(): ReturnType<DrizzleCameraDashboardRepo['findAttendanceStats']> {
    return this.repo.findAttendanceStats();
  }

  getProductionStats(): ReturnType<DrizzleCameraDashboardRepo['findProductionStats']> {
    return this.repo.findProductionStats();
  }

  getSafetyStats(): ReturnType<DrizzleCameraDashboardRepo['findSafetyStats']> {
    return this.repo.findSafetyStats();
  }

  getWeeklyTrend(): ReturnType<DrizzleCameraDashboardRepo['findWeeklyTrend']> {
    return this.repo.findWeeklyTrend();
  }

  getHeatmapData(
    zoneId: string | undefined,
    date: string | undefined,
  ): ReturnType<DrizzleCameraDashboardRepo['findHeatmapData']> {
    const targetDate = date ?? _time.now().toISOString().split('T')[0];
    return this.repo.findHeatmapData(zoneId, targetDate);
  }

  getHeatmapEmployees(limit: number): ReturnType<DrizzleCameraDashboardRepo['findHeatmapEmployees']> {
    return this.repo.findHeatmapEmployees(limit);
  }

  getHeatmapEmployee(id: string): ReturnType<DrizzleCameraDashboardRepo['findHeatmapEmployee']> {
    return this.repo.findHeatmapEmployee(id);
  }

  async generateReport(
    type: 'pdf' | 'excel',
    dateFrom: string | undefined,
    dateTo: string | undefined,
  ): Promise<Result<{ type: 'pdf' | 'excel'; generated_at: string; period: { from: string; to: string }; url: string; data: ReportData }>> {
    const from = dateFrom ?? new Date(Date.now() - 7 * MS_PER_DAY).toISOString().split('T')[0];
    const to = dateTo ?? _time.now().toISOString().split('T')[0];
    const r = await this.repo.generateReport(from, to);
    return r.ok
      ? Ok({
          type,
          generated_at: _time.now().toISOString(),
          period: { from, to },
          url: `/api/camera-reports/${type}/${Date.now()}`,
          data: r.data,
        })
      : Err(r.error);
  }
}
