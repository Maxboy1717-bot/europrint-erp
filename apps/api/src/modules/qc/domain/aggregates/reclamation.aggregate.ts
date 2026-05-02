import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { DefectSeverity } from './defect.aggregate';

export enum ReclamationStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export class Reclamation {
  constructor(public readonly id: string,
    public readonly customerName: string,
    public readonly customerId: string | null,
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
