import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { MS_PER_HOUR } from '@common/constants/app.constants';
import { Ok, Err, Result } from '@common/result';
import { DrizzleIotSensorsRepo } from '../infrastructure/repositories/drizzle-iot-sensors.repo';

type SensorsListData = Extract<
  Awaited<ReturnType<DrizzleIotSensorsRepo['listSensors']>>,
  { ok: true; data: unknown }
>['data'];
type SensorTrendsData = Extract<
  Awaited<ReturnType<DrizzleIotSensorsRepo['findSensorTrends']>>,
  { ok: true; data: unknown }
>['data'];

@Injectable()
export class IotSensorsExtendedService {
  constructor(private readonly repo: DrizzleIotSensorsRepo) {}

  getDashboard(): ReturnType<DrizzleIotSensorsRepo['findDashboard']> {
    return this.repo.findDashboard();
  }

  getLiveReadings(
    type: string | undefined,
    location: string | undefined,
    limit: number,
  ): ReturnType<DrizzleIotSensorsRepo['findLiveReadings']> {
    return this.repo.findLiveReadings(type, location, limit);
  }

  getAlerts(
    severity: string | undefined,
    limit: number,
  ): ReturnType<DrizzleIotSensorsRepo['findAlerts']> {
    return this.repo.findAlerts(severity, limit);
  }

  getOee(
    deviceId: string | undefined,
    period: string | undefined,
  ): ReturnType<DrizzleIotSensorsRepo['findOee']> {
    const days = parseInt(period ?? '7', 10) || 7;
    return this.repo.findOee(deviceId, days);
  }

  async listSensors(
    type: string | undefined,
    status: string | undefined,
    page: number,
    limit: number,
  ): Promise<Result<SensorsListData & { page: number; limit: number }>> {
    const offset = (Math.max(1, page) - 1) * limit;
    const r = await this.repo.listSensors(type, status, offset, limit);
    return r.ok ? Ok({ ...r.data, page, limit }) : Err(r.error);
  }

  getSensorHistory(
    id: string,
    from: string | undefined,
    to: string | undefined,
    limit: number,
  ): ReturnType<DrizzleIotSensorsRepo['findSensorHistory']> {
    const fromDate = from ?? new Date(Date.now() - 24 * MS_PER_HOUR).toISOString();
    const toDate = to ?? _time.now().toISOString();
    return this.repo.findSensorHistory(id, fromDate, toDate, limit);
  }

  async getSensorTrends(
    type: string | undefined,
    period: string | undefined,
  ): Promise<Result<{ period: string | undefined; data: SensorTrendsData }>> {
    const hours = period?.endsWith('h') ? parseInt(period, 10) : 24;
    const r = await this.repo.findSensorTrends(type, hours);
    return r.ok ? Ok({ period, data: r.data }) : Err(r.error);
  }
}
