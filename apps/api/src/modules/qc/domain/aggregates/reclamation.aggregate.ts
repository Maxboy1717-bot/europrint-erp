/**
 * @module reclamation.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { DefectSeverity } from './defect.aggregate';

// Values match the canonical qc_reclamations.status CHECK (lib/db qc-schema.ts) —
// the live DB column has no CHECK constraint but only these values are ever written.
export enum ReclamationStatus {
  NEW = 'new',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export class Reclamation {
  constructor(public readonly id: number,
    public readonly customerName: string,
    public readonly customerId: number | null,
    public readonly orderId: string | null,
    public readonly description: string,
    public readonly severity: DefectSeverity,
    public status: ReclamationStatus,
    public readonly reportedDate: Date,
    // SLA timer (qc_reclamations.deadline_days / sla_due_at — live DB columns,
    // previously unread/unwritten by this aggregate). deadlineDays = business
    // days allowed to resolve; slaDueAt = reportedDate + deadlineDays business
    // days, computed once at creation via computeSlaDueAt().
    public readonly deadlineDays: number,
    public slaDueAt: Date | null,
    public readonly assignedTo: string | null,
    public resolution: string | null,
    public resolvedAt: Date | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public readonly createdBy?: number) {}

  /**
   * Reportlangan sanadan `deadlineDays` ISH KUNI o'tgach SLA muddati (shanba/
   * yakshanba hisobga olinmaydi — TashkentTimeService.addBusinessDays).
   */
  static computeSlaDueAt(reportedDate: Date, deadlineDays: number): Date {
    return _time.addBusinessDays(reportedDate, deadlineDays);
  }

  /**
   * SLA muddati o'tganmi. Hal qilingan/rad etilgan reklamatsiya endi
   * "kechikkan" hisoblanmaydi — timer faqat ochiq (new/investigating)
   * holatlarda yuradi.
   */
  get isOverdue(): boolean {
    if (!this.slaDueAt) return false;
    if (this.status === ReclamationStatus.RESOLVED || this.status === ReclamationStatus.REJECTED) return false;
    return _time.isOverdue(this.slaDueAt);
  }

  resolve(resolution: string): void {
    this.status = ReclamationStatus.RESOLVED;
    this.resolution = resolution;
    this.resolvedAt = _time.now();
    this.updatedAt = _time.now();
  }
}
