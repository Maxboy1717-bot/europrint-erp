/**
 * @module transfer-request.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { DomainError } from '../../../../shared/domain/errors/domain-error';
export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export interface RequestLine {
  id: string;
  requestId: string;
  stockItemId: string;
  itemName: string;
  sku: string;
  requestedQty: number;
  approvedQty: number | null;
  unit: string;
}

export class TransferRequest {
  constructor(public readonly id: string,
    public readonly requestNumber: string,
    public readonly fromWarehouseId: string,
    public readonly toWarehouseId: string,
    public status: RequestStatus,
    public readonly lines: RequestLine[],
    public readonly requestedBy: string,
    public approvedBy: string | null,
    public approvedAt: Date | null,
    public readonly reason: string,
    public readonly createdAt: Date,
    public updatedAt: Date) {}

  approve(approverId: string): void {
    if (this.status !== RequestStatus.PENDING) {
      // INVALID_STATE: only PENDING transfer requests can be approved.
      throw new DomainError('INVALID_STATE', 'Faqat pending so\'rov tasdiqlanadi');
    }
    this.status = RequestStatus.APPROVED;
    this.approvedBy = approverId;
    this.approvedAt = _time.now();
    this.updatedAt = _time.now();
  }

  startTransit(): void {
    this.status = RequestStatus.IN_TRANSIT;
    this.updatedAt = _time.now();
  }

  complete(): void {
    this.status = RequestStatus.COMPLETED;
    this.updatedAt = _time.now();
  }

  reject(): void {
    if (this.status !== RequestStatus.PENDING && this.status !== RequestStatus.APPROVED) {
      // INVALID_STATE: reject() only valid from PENDING or APPROVED.
      throw new DomainError('INVALID_STATE', 'Faqat pending yoki approved so\'rovlar rad etilishi mumkin');
    }
    this.status = RequestStatus.REJECTED;
    this.updatedAt = _time.now();
  }
}
