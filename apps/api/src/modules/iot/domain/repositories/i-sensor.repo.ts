import { Result } from '@common/result';
import { SensorDevice } from '../aggregates/sensor-device.aggregate';
import { SensorReading } from '../aggregates/sensor-reading.aggregate';

export interface ISensorRepo {
  findDeviceById(id: string): Promise<Result<SensorDevice>>;
  findAllDevices(filters: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: SensorDevice[]; total: number }>>;
  saveDevice(device: SensorDevice): Promise<Result<SensorDevice>>;
  updateDevice(id: string, data: Partial<SensorDevice>): Promise<Result<SensorDevice>>;
  saveReading(reading: SensorReading): Promise<Result<SensorReading>>;
  findReadings(
    deviceId: string,
    opts: { from?: Date; to?: Date; limit?: number },
  ): Promise<Result<SensorReading[]>>;
  findAnomalies(opts: {
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: SensorReading[]; total: number }>>;
}

export const SENSOR_REPO = Symbol('SENSOR_REPO');
