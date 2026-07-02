/**
 * @module defect.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
export enum DefectSeverity {
  MINOR = 'minor',
  MAJOR = 'major',
  CRITICAL = 'critical',
}

export enum DefectStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  REWORK = 'rework',
  SCRAPPED = 'scrapped',
  RESOLVED = 'resolved',
}

export class Defect {
  constructor(public readonly id: string,
    public readonly inspectionId: string | null,
    public readonly productionOrderId: string | null,
    public readonly workCenterId: string | null,
    public readonly defectCode: string,
    public readonly description: string,
    public readonly severity: DefectSeverity,
    public status: DefectStatus,
    public readonly quantity: number,
    public readonly unit: string,
    public readonly reportedBy: string,
    public resolvedBy: string | null,
    public resolvedAt: Date | null,
    public resolution: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    // QC-birlashtirish (2026-07-02): qc_braks-dan ko'chirilgan maydonlar -- faqat
    // brak-yozuvlarda to'ldiriladi (ReportDefectCommand.brakExtras orqali).
    public readonly papkaOrderId: number | null = null,
    public readonly stage: string | null = null,
    public costImpact: number | null = null,
    public isReworkable: boolean | null = null,
    public reworked: boolean | null = null,
    public readonly brakDate: string | null = null) {}

  resolve(userId: string, resolution: string): void {
    this.status = DefectStatus.RESOLVED;
    this.resolvedBy = userId;
    this.resolvedAt = _time.now();
    this.resolution = resolution;
    this.updatedAt = _time.now();
  }

  markAsRework(): void {
    this.status = DefectStatus.REWORK;
    this.updatedAt = _time.now();
  }

  markAsScrapped(): void {
    this.status = DefectStatus.SCRAPPED;
    this.updatedAt = _time.now();
  }
}
