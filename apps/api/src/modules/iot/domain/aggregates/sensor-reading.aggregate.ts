/**
 * @module sensor-reading.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { v4 as uuid } from 'uuid';

export class SensorReading {
  id: string;
  deviceId: string;
  value: number;
  unit: string;
  timestamp: Date;
  isAnomaly: boolean;

  constructor(
    deviceId: string,
    value: number,
    unit: string,
  ) {
    this.id = uuid();
    this.deviceId = deviceId;
    this.value = value;
    this.unit = unit;
    this.timestamp = _time.now();
    this.isAnomaly = false;
  }

  markAsAnomaly(): void {
    this.isAnomaly = true;
  }

  static create(deviceId: string, value: number, unit: string): SensorReading {
    return new SensorReading(deviceId, value, unit);
  }
}
