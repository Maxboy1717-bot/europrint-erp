/**
 * @module iot-main.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { DrizzleIotMainRepo } from '../infrastructure/repositories/drizzle-iot-main.repo';
import { DrizzleIotOeeRepo } from '../infrastructure/repositories/drizzle-iot-oee.repo';

type ProductionMetricData = Extract<
  Awaited<ReturnType<DrizzleIotOeeRepo['findProductionMetrics']>>,
  { ok: true; data: unknown }
>['data'];
type ShiftReportData = Extract<
  Awaited<ReturnType<DrizzleIotOeeRepo['findShiftReport']>>,
  { ok: true; data: unknown }
>['data'];

@Injectable()
export class IotMainService {
  private readonly logger = new Logger(IotMainService.name);

  constructor(
    private readonly repo: DrizzleIotMainRepo,
    private readonly oeeRepo: DrizzleIotOeeRepo,
  ) {}

  getAlerts(
    status: string | undefined,
    severity: string | undefined,
    limit: number,
  ): ReturnType<DrizzleIotMainRepo['findAlerts']> {
    return this.repo.findAlerts(status, severity, limit);
  }

  acknowledgeAlert(id: string): ReturnType<DrizzleIotMainRepo['acknowledgeAlert']> {
    return this.repo.acknowledgeAlert(id);
  }

  getAttendanceLive(): ReturnType<DrizzleIotMainRepo['findAttendanceLive']> {
    return this.repo.findAttendanceLive();
  }

  getRoomInspections(
    status: string | undefined,
    limit: number,
  ): ReturnType<DrizzleIotMainRepo['findRoomInspections']> {
    return this.repo.findRoomInspections(status, limit);
  }

  getEmployeeHealth(
    employeeId: string | undefined,
    limit: number,
  ): ReturnType<DrizzleIotMainRepo['findEmployeeHealth']> {
    return this.repo.findEmployeeHealth(employeeId, limit);
  }

  getMachineStatusCurrent(): ReturnType<DrizzleIotMainRepo['findMachinesCurrent']> {
    return this.repo.findMachinesCurrent();
  }

  getMachineStatusLogs(
    deviceId: string | undefined,
    limit: number,
  ): ReturnType<DrizzleIotMainRepo['findMachineLogs']> {
    return this.repo.findMachineLogs(deviceId, limit);
  }

  getSafetyViolations(
    status: string | undefined,
    severity: string | undefined,
    limit: number,
  ): ReturnType<DrizzleIotMainRepo['findSafetyViolations']> {
    return this.repo.findSafetyViolations(status, severity, limit);
  }

  getEmployeeProductivity(
    departmentId: string | undefined,
    limit: number,
  ): ReturnType<DrizzleIotMainRepo['findEmployeeProductivity']> {
    return this.repo.findEmployeeProductivity(departmentId, limit);
  }

  getEnvironmentData(
    deviceType: string | undefined,
    location?: string,
    deviceId?: string,
  ): ReturnType<DrizzleIotMainRepo['findEnvironmentData']> {
    return this.repo.findEnvironmentData(deviceType, location, deviceId);
  }

  getQualityDefects(
    status: string | undefined,
    cameraId: string | undefined,
    limit: number,
  ): ReturnType<DrizzleIotMainRepo['findQualityDefects']> {
    return this.repo.findQualityDefects(status, cameraId, limit);
  }

  getRecognitionStats(): ReturnType<DrizzleIotMainRepo['findRecognitionStats']> {
    return this.repo.findRecognitionStats();
  }

  getOee(
    deviceId: string | undefined,
    period: string | undefined,
  ): ReturnType<DrizzleIotOeeRepo['findOee']> {
    const days = parseInt(period ?? '7', 10) || 7;
    return this.oeeRepo.findOee(deviceId, days);
  }

  async getProductionMetrics(
    shift?: string,
  ): Promise<Result<{ shift: string; metrics: ProductionMetricData }>> {
    try {
      const r = await this.oeeRepo.findProductionMetrics();
      return r.ok ? Ok({ shift: shift ?? 'current', metrics: r.data }) : Err(r.error);
    } catch (error) {
      this.logger.error(
        { method: 'getProductionMetrics', shift, error },
        'Database query failed',
      );
      return Err(`Failed to fetch production metrics: ${(error as Error).message}`);
    }
  }

  async getShiftReport(
    shift: string | undefined,
    date: string | undefined,
  ): Promise<Result<{ date: string; shift: string; report: ShiftReportData }>> {
    try {
      const targetDate = date ? `${date}T00:00:00Z` : new Date(_time.now().setHours(0, 0, 0, 0)).toISOString();
      const endDate = date ? `${date}T23:59:59Z` : new Date(_time.now().setHours(23, 59, 59, 999)).toISOString();
      const r = await this.oeeRepo.findShiftReport(targetDate, endDate);
      return r.ok
        ? Ok({ date: date ?? _time.now().toISOString().slice(0, 10), shift: shift ?? 'all', report: r.data })
        : Err(r.error);
    } catch (error) {
      this.logger.error(
        { method: 'getShiftReport', shift, date, error },
        'Database query failed',
      );
      return Err(`Failed to fetch shift report: ${(error as Error).message}`);
    }
  }

  getDashboard(): ReturnType<DrizzleIotMainRepo['findDashboard']> {
    return this.repo.findDashboard();
  }

  getDeviceStats(deviceId: string): ReturnType<DrizzleIotMainRepo['findDeviceStats']> {
    return this.repo.findDeviceStats(deviceId);
  }
}
