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
    public readonly assignedTo: string | null,
    public resolution: string | null,
    public resolvedAt: Date | null,
    public readonly createdAt: Date,
    public updatedAt: Date) {}

  resolve(resolution: string): void {
    this.status = ReclamationStatus.RESOLVED;
    this.resolution = resolution;
    this.resolvedAt = _time.now();
    this.updatedAt = _time.now();
  }
}
