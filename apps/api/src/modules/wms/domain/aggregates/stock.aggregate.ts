import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AggregateRoot } from '@nestjs/cqrs';
import { Err } from '@common/result';
import { Result } from '@common/result';

export class Stock extends AggregateRoot {
  private id: number;
  private warehouseId: number;
  private materialId: number;
  private quantity: number;
  private reservedQuantity: number;
  private expiryDate: Date | null;
  private receivedAt: Date;
  private batchNumber: string;

  constructor(
    id: number,
    warehouseId: number,
    materialId: number,
    quantity: number,
    expiryDate: Date | null,
    batchNumber: string,
  ) {
    super();
    this.id = id;
    this.warehouseId = warehouseId;
    this.materialId = materialId;
    this.quantity = quantity;
    this.reservedQuantity = 0;
    this.expiryDate = expiryDate;
    this.receivedAt = _time.now();
    this.batchNumber = batchNumber;
  }

  getId(): number {
    return this.id;
  }

  getWarehouseId(): number {
    return this.warehouseId;
  }

  getMaterialId(): number {
    return this.materialId;
  }

  getQuantity(): number {
    return this.quantity;
  }

  getReservedQuantity(): number {
    return this.reservedQuantity;
  }

  getAvailableQuantity(): number {
    return this.quantity - this.reservedQuantity;
  }

  getExpiryDate(): Date | null {
    return this.expiryDate;
  }

  reserve(amount: number): Result<void> {
    if (amount > this.getAvailableQuantity()) {
      return Err('Yetarli stock yo\'q');
    }
    if (amount <= 0) {
      return Err('Miqdor 0 dan katta bo\'lishi kerak');
    }
    this.reservedQuantity += amount;
    this.apply({
      type: 'STOCK_RESERVED',
      data: { stockId: this.id, amount, timestamp: _time.now() },
    });
    return { ok: true, data: undefined };
  }

  issue(amount: number): Result<void> {
    if (amount > this.reservedQuantity) {
      return Err('Belgilangan miqdor yetarli emas');
    }
    this.quantity -= amount;
    this.reservedQuantity -= amount;
    this.apply({
      type: 'STOCK_ISSUED',
      data: { stockId: this.id, amount, timestamp: _time.now() },
    });
    return { ok: true, data: undefined };
  }

  receive(amount: number): Result<void> {
    if (amount <= 0) {
      return Err('Miqdor 0 dan katta bo\'lishi kerak');
    }
    this.quantity += amount;
    this.apply({
      type: 'STOCK_RECEIVED',
      data: { stockId: this.id, amount, timestamp: _time.now() },
    });
    return { ok: true, data: undefined };
  }

  isExpired(): boolean {
    if (!this.expiryDate) return false;
    return this.expiryDate < _time.now();
  }
}
