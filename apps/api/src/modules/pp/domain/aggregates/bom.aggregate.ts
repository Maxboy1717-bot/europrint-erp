/**
 * @module bom.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { Err } from '@common/result';
import { Result } from '@common/result';

export enum BomStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  ARCHIVED = 'archived',
}

export class BomItem {
  constructor(public materialId: number,
    public quantity: number,
    public scrapPercentage: number = 0) {}

  getNetQuantity(): number {
    return this.quantity * (1 + this.scrapPercentage / 100);
  }
}

export class Bom extends AggregateRoot {
  private id: number;
  private productId: number;
  private version: number;
  private status: BomStatus;
  private items: BomItem[] = [];
  private approvedAt: Date | null = null;
  private approvedBy: number | null = null;

  constructor(id: number, productId: number, version: number) {
    super();
    this.id = id;
    this.productId = productId;
    this.version = version;
    this.status = BomStatus.DRAFT;
  }

  getId(): number { return this.id; }
  getStatus(): BomStatus { return this.status; }
  getProductId(): number { return this.productId; }
  getVersion(): number { return this.version; }

  getItems(): BomItem[] {
    return this.items;
  }

  addItem(item: BomItem): Result<void> {
    if (this.status !== BomStatus.DRAFT) {
      return Err('Taqdim etilgan BOM ni o\'zgartira olmaysiz');
    }
    const exists = this.items.find((i) => i.materialId === item.materialId);
    if (exists) {
      return Err('Material allaqachon mavjud');
    }
    this.items.push(item);
    return { ok: true, data: undefined };
  }

  approve(approvedBy: number): Result<void> {
    if (this.status !== BomStatus.DRAFT) {
      return Err('Faqat taslagi BOM ni tasdiqlash mumkin');
    }
    if (this.items.length === 0) {
      return Err('BOM bo\'sh bo\'lishi mumkin emas');
    }
    this.status = BomStatus.APPROVED;
    this.approvedAt = _time.now();
    this.approvedBy = approvedBy;
    this.addDomainEvent({
      type: 'BOM_APPROVED',
      data: { bomId: this.id, approvedBy },
    });
    return { ok: true, data: undefined };
  }

  getTotalMaterialCost(priceMap: Map<number, number>): number {
    return this.items.reduce((sum, item) => sum + item.getNetQuantity() * (priceMap.get(item.materialId) || 0), 0);
  }
}
