/**
 * @module inspection.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { v4 as uuid } from 'uuid';
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { InspectionStatus } from '../enums/inspection-status.enum';
import { Defect } from './defect.aggregate';
import { QcPassedEvent, QcFailedEvent, QcReworkEvent } from '../events';

export class Inspection extends AggregateRoot {
  id: string;
  orderId: number;
  batchId: string;
  status: InspectionStatus;
  defects: Defect[];
  inspectorId: number;
  sampleSize: number;
  defectsFoundCount: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    orderId: number,
    batchId: string,
    inspectorId: number,
    sampleSize: number,
  ) {
    super();
    this.id = uuid();
    this.orderId = orderId;
    this.batchId = batchId;
    this.status = InspectionStatus.PENDING;
    this.defects = [];
    this.inspectorId = inspectorId;
    this.sampleSize = sampleSize;
    this.defectsFoundCount = 0;
    this.createdAt = _time.now();
    this.updatedAt = _time.now();
  }

  start(): void {
    this.status = InspectionStatus.IN_PROGRESS;
    this.updatedAt = _time.now();
  }

  addDefect(defect: Defect): void {
    this.defects.push(defect);
    this.defectsFoundCount += 1;
  }

  pass(): void {
    this.status = InspectionStatus.PASSED;
    this.updatedAt = _time.now();
    this.addDomainEvent(new QcPassedEvent(this.id, this.orderId));
  }

  fail(reason: string): void {
    this.status = InspectionStatus.FAILED;
    this.updatedAt = _time.now();
    this.addDomainEvent(new QcFailedEvent(this.id, this.orderId, reason));
  }

  rework(reason: string = ''): void {
    this.status = InspectionStatus.REWORK;
    this.updatedAt = _time.now();
    this.addDomainEvent(new QcReworkEvent(this.id, this.orderId, reason));
  }

  static create(
    orderId: number,
    batchId: string,
    inspectorId: number,
    sampleSize: number,
  ): Inspection {
    return new Inspection(orderId, batchId, inspectorId, sampleSize);
  }
}
