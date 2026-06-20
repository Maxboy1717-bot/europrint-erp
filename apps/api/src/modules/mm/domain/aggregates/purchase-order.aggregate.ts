/**
 * @module purchase-order.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { Err } from '@common/result';
import { Result } from '@common/result';
import type { IOrderHeader, OrderKind } from '@shared/domain/contracts/i-order-header';

export enum PoStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  RECEIVED = 'received',
  INVOICED = 'invoiced',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export class PurchaseOrderItem {
  constructor(public materialId: number,
    public quantity: number,
    public unitPrice: number) {}

  getTotalPrice(): number {
    return this.quantity * this.unitPrice;
  }
}

export class PurchaseOrder extends AggregateRoot implements IOrderHeader {
  private _id: number;
  private _poNumber: string;
  private _supplierId: number;
  private _status: PoStatus;
  private _items: PurchaseOrderItem[] = [];
  private _createdBy: number;
  private _approvedBy: number | null = null;
  private _receivedQuantity: number = 0;
  private _invoicedQuantity: number = 0;
  private _createdAt: Date;
  private _approvedAt: Date | null = null;

  constructor(id: number, poNumber: string, supplierId: number, createdBy: number) {
    super();
    this._id = id;
    this._poNumber = poNumber;
    this._supplierId = supplierId;
    this._createdBy = createdBy;
    this._status = PoStatus.DRAFT;
    this._createdAt = _time.now();
  }

  getId(): number {
    return this._id;
  }

  getPoNumber(): string {
    return this._poNumber;
  }

  getSupplierId(): number {
    return this._supplierId;
  }

  getStatus(): PoStatus {
    return this._status;
  }

  getCreatedBy(): number {
    return this._createdBy;
  }

  getTotalAmount(): number {
    return this._items.reduce((sum, item) => sum + item.getTotalPrice(), 0);
  }

  addItem(item: PurchaseOrderItem): Result<void> {
    if (this._status !== PoStatus.DRAFT) {
      return Err('Taqdim etilgan PO ni o\'zgartira olmaysiz');
    }
    const exists = this._items.find((i) => i.materialId === item.materialId);
    if (exists) {
      return Err('Material allaqachon mavjud');
    }
    this._items.push(item);
    return { ok: true, data: undefined };
  }

  approve(approvedBy: number): Result<void> {
    // §6 SoD: Xarid yaratish + tasdiqlash bir kishida MUMKIN EMAS
    if (approvedBy === this._createdBy) {
      return Err('Yaratuvchi va tasdiqlash o\'tkazuvchi boshqa bo\'lishi kerak');
    }
    if (this._status !== PoStatus.DRAFT) {
      return Err('Faqat taslagi PO ni tasdiqlash mumkin');
    }
    if (this._items.length === 0) {
      return Err('PO bo\'sh bo\'lishi mumkin emas');
    }
    this._status = PoStatus.APPROVED;
    this._approvedBy = approvedBy;
    this._approvedAt = _time.now();
    this.addDomainEvent({
      type: 'PURCHASE_ORDER_APPROVED',
      data: { poId: this._id, approvedBy, totalAmount: this.getTotalAmount() },
    });
    return { ok: true, data: undefined };
  }

  recordGoodsReceipt(quantity: number): Result<void> {
    if (this._status !== PoStatus.APPROVED) {
      return Err('PO taqdim etilmagan');
    }
    this._receivedQuantity += quantity;
    if (this._receivedQuantity >= this._items.reduce((sum, i) => sum + i.quantity, 0)) {
      this._status = PoStatus.RECEIVED;
    }
    this.addDomainEvent({
      type: 'GOODS_RECEIPT_RECORDED',
      data: { poId: this._id, quantity },
    });
    return { ok: true, data: undefined };
  }

  recordInvoice(quantity: number): Result<void> {
    if (this._status !== PoStatus.RECEIVED) {
      return Err('Malumot olish mumkin emas');
    }
    this._invoicedQuantity += quantity;
    if (this._invoicedQuantity >= this._receivedQuantity) {
      this._status = PoStatus.INVOICED;
    }
    return { ok: true, data: undefined };
  }

  close(): Result<void> {
    if (this._status !== PoStatus.INVOICED) {
      return Err('PO yakuniy emas');
    }
    this._status = PoStatus.CLOSED;
    return { ok: true, data: undefined };
  }

  getItems(): PurchaseOrderItem[] {
    return [...this._items];
  }

  // --- IOrderHeader marker (cross-context "an order" shape) ---
  get id(): number { return this._id; }
  /** Alias for poNumber so cross-context audit code can use a single name. */
  get orderNumber(): string { return this._poNumber; }
  get status(): string { return this._status; }
  get createdAt(): Date { return this._createdAt; }
  get createdBy(): number { return this._createdBy; }
  get kind(): OrderKind { return 'purchase'; }
}
