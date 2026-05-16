/**
 * @module routing.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { Err } from '@common/result';
import { Result } from '@common/result';

export enum RoutingStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  ARCHIVED = 'archived',
}

export class Operation {
  constructor(public sequence: number,
    public workCenterId: number,
    public standardTime: number, // minutes
    public setupTime: number = 0,
    public rework: boolean = false) {}
}

export class Routing extends AggregateRoot {
  private id: number;
  private productId: number;
  private version: number;
  private status: RoutingStatus;
  private operations: Operation[] = [];
  private approvedAt: Date | null = null;
  private approvedBy: number | null = null;

  constructor(id: number, productId: number, version: number) {
    super();
    this.id = id;
    this.productId = productId;
    this.version = version;
    this.status = RoutingStatus.DRAFT;
  }

  getId(): number { return this.id; }
  getStatus(): RoutingStatus { return this.status; }
  getProductId(): number { return this.productId; }
  getVersion(): number { return this.version; }

  getOperations(): Operation[] {
    return this.operations.sort((a, b) => a.sequence - b.sequence);
  }

  addOperation(op: Operation): Result<void> {
    if (this.status !== RoutingStatus.DRAFT) {
      return Err('Taqdim etilgan Routing ni o\'zgartira olmaysiz');
    }
    const exists = this.operations.find((o) => o.sequence === op.sequence);
    if (exists) {
      return Err(`Ketma-ketlik ${op.sequence} allaqachon mavjud`);
    }
    this.operations.push(op);
    return { ok: true, data: undefined };
  }

  approve(approvedBy: number): Result<void> {
    if (this.status !== RoutingStatus.DRAFT) {
      return Err('Faqat taslagi Routing ni tasdiqlash mumkin');
    }
    if (this.operations.length === 0) {
      return Err('Routing bo\'sh bo\'lishi mumkin emas');
    }
    this.status = RoutingStatus.APPROVED;
    this.approvedAt = _time.now();
    this.approvedBy = approvedBy;
    this.addDomainEvent({
      type: 'ROUTING_APPROVED',
      data: { routingId: this.id, approvedBy },
    });
    return { ok: true, data: undefined };
  }

  getTotalTime(): number {
    return this.operations.reduce((sum, op) => sum + op.standardTime + op.setupTime, 0);
  }

  getWorkCenters(): number[] {
    return [...new Set(this.operations.map((op) => op.workCenterId))];
  }
}
