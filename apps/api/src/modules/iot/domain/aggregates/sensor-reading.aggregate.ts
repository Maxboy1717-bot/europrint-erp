/**
 * @module sensor-reading.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { v4 as uuid } from 'uuid';
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { Ok, Err, AppErr, Result } from '@common/result';
import { SensorAnomalyDetectedEvent } from '../events';

export class SensorReading extends AggregateRoot {
  id: string;
  deviceId: string;
  value: number;
  unit: string;
  timestamp: Date;
  isAnomaly: boolean;
  anomalyThreshold: number | null;
  anomalyReason: string | null;

  constructor(
    deviceId: string,
    value: number,
    unit: string,
  ) {
    super();
    this.id = uuid();
    this.deviceId = deviceId;
    this.value = value;
    this.unit = unit;
    this.timestamp = _time.now();
    this.isAnomaly = false;
    this.anomalyThreshold = null;
    this.anomalyReason = null;
  }

  markAsAnomaly(threshold?: number, reason?: string): Result<void> | void {
    // Backwards-compatible: legacy callers invoke markAsAnomaly() with no args.
    // New behavior: markAsAnomaly(threshold, reason) enforces invariants and raises an event.
    if (typeof threshold === 'number' && typeof reason === 'string') {
      if (!Number.isFinite(threshold)) {
        return Err(AppErr('VALIDATION', 'threshold must be a finite number'));
      }
      if (reason.trim().length === 0) {
        return Err(AppErr('VALIDATION', 'reason is required'));
      }
      if (this.isAnomaly) {
        return Err(AppErr('BUSINESS_RULE_VIOLATION', 'Reading is already marked as anomaly'));
      }
      this.isAnomaly = true;
      this.anomalyThreshold = threshold;
      this.anomalyReason = reason;
      this.addDomainEvent(
        new SensorAnomalyDetectedEvent(this.id, this.deviceId, this.value, threshold, reason),
      );
      return Ok<void>();
    }
    this.isAnomaly = true;
  }

  static create(deviceId: string, value: number, unit: string): SensorReading {
    return new SensorReading(deviceId, value, unit);
  }
}
