/**
 * @module i-sensor.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
import { SensorDevice } from '../aggregates/sensor-device.aggregate';
import { SensorReading } from '../aggregates/sensor-reading.aggregate';
import { SensorType } from '../enums/sensor-status.enum';

export interface RegisterDeviceInput {
  deviceCode: string;
  name: string;
  type?: SensorType | string;
  location?: string;
  thresholds?: { min?: number | null; max?: number | null };
}

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

  /**
   * Returns true if a device with the given sensor_code already exists.
   * Used by RegisterDeviceHandler (PA1-10).
   */
  existsByCode(deviceCode: string): Promise<Result<boolean>>;

  /**
   * Inserts a new sensor device with optional thresholds and returns it.
   * Used by RegisterDeviceHandler (PA1-10).
   */
  registerDevice(input: RegisterDeviceInput): Promise<Result<SensorDevice>>;

  /**
   * Updates a device's min/max thresholds, returns the updated device.
   * Used by UpdateDeviceThresholdsHandler (PA1-10).
   */
  updateThresholds(
    deviceId: string,
    thresholds: { min?: number | null; max?: number | null },
  ): Promise<Result<SensorDevice>>;
}

export const SENSOR_REPO = Symbol('SENSOR_REPO');
