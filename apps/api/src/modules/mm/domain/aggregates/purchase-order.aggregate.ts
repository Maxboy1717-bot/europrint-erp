import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AggregateRoot } from '@nestjs/cqrs';
import { Err } from '@common/result';
import { Result } from '@common/result';

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

export class PurchaseOrder extends AggregateRoot {
  private id: number;
  private poNumber: string;
  private supplierId: number;
  private status: PoStatus;
  private items: PurchaseOrderItem[] = [];
  private createdBy: number;
  private approvedBy: number | null = null;
  private receivedQuantity: number = 0;
  private invoicedQuantity: number = 0;
  private createdAt: Date;
  private approvedAt: Date | null = null;

  constructor(id: number, poNumber: string, supplierId: number, createdBy: number) {
    super();
    this.id = id;
    this.poNumber = poNumber;
    this.supplierId = supplierId;
    this.createdBy = createdBy;
    this.status = PoStatus.DRAFT;
    this.createdAt = _time.now();
  }

  getId(): number {
    return this.id;
  }

  getPoNumber(): string {
    return this.poNumber;
  }

  getSupplierId(): number {
    return this.supplierId;
  }

  getStatus(): PoStatus {
    return this.status;
  }

  getCreatedBy(): number {
    return this.createdBy;
  }

  getTotalAmount(): number {
    return this.items.reduce((sum, item) => sum + item.getTotalPrice(), 0);
  }

  addItem(item: PurchaseOrderItem): Result<void> {
    if (this.status !== PoStatus.DRAFT) {
      return Err('Taqdim etilgan PO ni o\'zgartira olmaysiz');
    }
    const exists = this.items.find((i) => i.materialId === item.materialId);
    if (exists) {
      return Err('Material allaqachon mavjud');
    }
    this.items.push(item);
    return { ok: true, data: undefined };
  }

  approve(approvedBy: number): Result<void> {
    // §6 SoD: Xarid yaratish + tasdiqlash bir kishida MUMKIN EMAS
    if (approvedBy === this.createdBy) {
      return Err('Yaratuvchi va tasdiqlash o\'tkazuvchi boshqa bo\'lishi kerak');
    }
    if (this.status !== PoStatus.DRAFT) {
      return Err('Faqat taslagi PO ni tasdiqlash mumkin');
    }
    if (this.items.length === 0) {
      return Err('PO bo\'sh bo\'lishi mumkin emas');
    }
    this.status = PoStatus.APPROVED;
    this.approvedBy = approvedBy;
    this.approvedAt = _time.now();
    this.apply({
      type: 'PURCHASE_ORDER_APPROVED',
      data: { poId: this.id, approvedBy, totalAmount: this.getTotalAmount() },
    });
    return { ok: true, data: undefined };
  }

  recordGoodsReceipt(quantity: number): Result<void> {
    if (this.status !== PoStatus.APPROVED) {
      return Err('PO taqdim etilmagan');
    }
    this.receivedQuantity += quantity;
    if (this.receivedQuantity >= this.items.reduce((sum, i) => sum + i.quantity, 0)) {
      this.status = PoStatus.RECEIVED;
    }
    this.apply({
      type: 'GOODS_RECEIPT_RECORDED',
      data: { poId: this.id, quantity },
    });
    return { ok: true, data: undefined };
  }

  recordInvoice(quantity: number): Result<void> {
    if (this.status !== PoStatus.RECEIVED) {
      return Err('Malumot olish mumkin emas');
    }
    this.invoicedQuantity += quantity;
    if (this.invoicedQuantity >= this.receivedQuantity) {
      this.status = PoStatus.INVOICED;
    }
    return { ok: true, data: undefined };
  }

  close(): Result<void> {
    if (this.status !== PoStatus.INVOICED) {
      return Err('PO yakuniy emas');
    }
    this.status = PoStatus.CLOSED;
    return { ok: true, data: undefined };
  }
}
