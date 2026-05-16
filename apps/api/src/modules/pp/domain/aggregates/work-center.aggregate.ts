/**
 * @module work-center.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
import { Ok, Err, AppErr, Result } from '@common/result';
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import {
  WorkCenterCapacityChangedEvent,
  WorkCenterOutOfServiceEvent,
} from '../events';

const _time = new TashkentTimeService();

export enum WorkCenterType {
  LINE = 'line',
  MACHINE = 'machine',
  WORKSHOP = 'workshop',
  MANUAL = 'manual',
}

export class WorkCenter extends AggregateRoot {
  public capacity: number;
  public isActive: boolean;
  public updatedAt: Date;
  public outOfServiceReason: string | null = null;

  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly name: string,
    public readonly type: WorkCenterType,
    capacity: number,
    public readonly costPerHour: number,
    public readonly certificationLmsCourseId: string | null,
    public readonly department: string | null,
    isActive: boolean,
    public readonly createdAt: Date,
    updatedAt: Date,
  ) {
    super();
    this.capacity = capacity;
    this.isActive = isActive;
    this.updatedAt = updatedAt;
  }

  setCapacity(maxOrdersPerDay: number): Result<void> {
    if (!Number.isFinite(maxOrdersPerDay)) {
      return Err(AppErr('VALIDATION', 'maxOrdersPerDay must be a finite number'));
    }
    if (maxOrdersPerDay <= 0) {
      return Err(AppErr('VALIDATION', 'maxOrdersPerDay must be greater than 0'));
    }
    if (maxOrdersPerDay === this.capacity) {
      return Err(AppErr('BUSINESS_RULE_VIOLATION', 'Capacity is unchanged'));
    }
    const oldCapacity = this.capacity;
    this.capacity = maxOrdersPerDay;
    this.updatedAt = _time.now();
    this.addDomainEvent(
      new WorkCenterCapacityChangedEvent(this.id, oldCapacity, maxOrdersPerDay),
    );
    return Ok<void>();
  }

  markOutOfService(reason: string, by: number): Result<void> {
    if (typeof reason !== 'string' || reason.trim().length === 0) {
      return Err(AppErr('VALIDATION', 'reason is required'));
    }
    if (!Number.isInteger(by) || by <= 0) {
      return Err(AppErr('VALIDATION', 'by must be a positive integer'));
    }
    if (!this.isActive) {
      return Err(AppErr('BUSINESS_RULE_VIOLATION', 'Work center is already out of service'));
    }
    this.isActive = false;
    this.outOfServiceReason = reason;
    this.updatedAt = _time.now();
    this.addDomainEvent(new WorkCenterOutOfServiceEvent(this.id, reason, by));
    return Ok<void>();
  }
}
