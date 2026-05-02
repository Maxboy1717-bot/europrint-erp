import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { InternalServerErrorException } from '@nestjs/common';
export enum CountStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  APPROVED = 'approved',
}

export interface CountLine {
  id: string;
  countId: string;
  stockItemId: string;
  sku: string;
  itemName: string;
  systemQuantity: number;
  countedQuantity: number;
  variance: number;
  unit: string;
  location: string | null;
  notes: string | null;
}

export class InventoryCount {
  constructor(public readonly id: string,
    public readonly warehouseId: string,
    public readonly countNumber: string,
    public status: CountStatus,
    public readonly lines: CountLine[],
    public readonly startedBy: string,
    public approvedBy: string | null,
    public approvedAt: Date | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date) {}

  get totalVarianceItems(): number {
    return this.lines.filter((l) => l.variance !== 0).length;
  }

  get totalVarianceValue(): number {
    return this.lines.reduce((sum, l) => sum + Math.abs(l.variance), 0);
  }

  complete(): void {
    if (this.status !== CountStatus.IN_PROGRESS) {
      throw new InternalServerErrorException('Count must be in_progress to complete');
    }
    this.status = CountStatus.COMPLETED;
    this.updatedAt = _time.now();
  }

  approve(approverId: string): void {
    if (this.status !== CountStatus.COMPLETED) {
      throw new InternalServerErrorException('Count must be completed to approve');
    }
    this.status = CountStatus.APPROVED;
    this.approvedBy = approverId;
    this.approvedAt = _time.now();
    this.updatedAt = _time.now();
  }
}
