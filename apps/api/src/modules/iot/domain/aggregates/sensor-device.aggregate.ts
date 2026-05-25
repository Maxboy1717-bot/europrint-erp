/**
 * @module sensor-device.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { v4 as uuid } from 'uuid';
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { SensorStatus, SensorType } from '../enums/sensor-status.enum';
import { SensorReading } from './sensor-reading.aggregate';

export class SensorDevice extends AggregateRoot {
  id: string;
  machineId: string;
  name: string;
  type: SensorType;
  status: SensorStatus;
  readings: SensorReading[];
  oee: number;
  lastReading: SensorReading | null;
  createdAt: Date;
  updatedAt: Date;
  location?: string;
  thresholds?: { min?: number; max?: number; unit?: string };

  constructor(
    machineId: string,
    name: string,
    type: SensorType,
  ) {
    super();
    this.id = uuid();
    this.machineId = machineId;
    this.name = name;
    this.type = type;
    this.status = SensorStatus.INACTIVE;
    this.readings = [];
    this.oee = 0;
    this.lastReading = null;
    this.createdAt = _time.now();
    this.updatedAt = _time.now();
    this.location = undefined;
    this.thresholds = undefined;
  }

  addReading(reading: SensorReading): void {
    this.readings.push(reading);
    this.lastReading = reading;
    this.updatedAt = _time.now();
  }

  calculateOEE(): number {
    if (this.readings.length === 0) return 0;
    const recentReadings = this.readings.slice(-100);
    const validReadings = (Array.isArray(recentReadings) ? recentReadings : []).filter((r) => !r.isAnomaly);
    return (validReadings.length / recentReadings.length) * 100;
  }

  activate(): void {
    this.status = SensorStatus.ACTIVE;
  }

  deactivate(): void {
    this.status = SensorStatus.INACTIVE;
  }

  static create(machineId: string, name: string, type: SensorType): SensorDevice {
    return new SensorDevice(machineId, name, type);
  }
}
