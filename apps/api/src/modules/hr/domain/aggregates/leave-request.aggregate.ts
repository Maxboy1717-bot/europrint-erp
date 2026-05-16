/**
 * @module leave-request.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { InternalServerErrorException } from '@nestjs/common';
export enum LeaveType {
  ANNUAL = 'annual',
  SICK = 'sick',
  MATERNITY = 'maternity',
  UNPAID = 'unpaid',
  STUDY = 'study',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export class LeaveRequest {
  constructor(public readonly id: string,
    public readonly employeeId: string,
    public readonly userId: string,
    public readonly leaveType: LeaveType,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly daysRequested: number,
    public status: LeaveStatus,
    public readonly reason: string,
    public approvedBy: string | null,
    public approvedAt: Date | null,
    public rejectedBy: string | null,
    public rejectionReason: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date) {}

  get isActive(): boolean {
    return (
      this.status === LeaveStatus.APPROVED &&
      _time.now() >= this.startDate &&
      _time.now() <= this.endDate
    );
  }

  approve(approverId: string): void {
    if (this.status !== LeaveStatus.PENDING) {
      // I18N_LEAK: domain aggregate (no DI). Caller may translate via 'errors.onlyPendingApprovable'.
      throw new InternalServerErrorException('Faqat pending so\'rov tasdiqlanadi');
    }
    this.status = LeaveStatus.APPROVED;
    this.approvedBy = approverId;
    this.approvedAt = _time.now();
    this.updatedAt = _time.now();
  }

  reject(rejectorId: string, reason: string): void {
    if (this.status !== LeaveStatus.PENDING) {
      // I18N_LEAK: domain aggregate (no DI). Caller may translate via 'errors.onlyPendingRejectable'.
      throw new InternalServerErrorException('Faqat pending so\'rov rad etiladi');
    }
    this.status = LeaveStatus.REJECTED;
    this.rejectedBy = rejectorId;
    this.rejectionReason = reason;
    this.updatedAt = _time.now();
  }

  cancel(): void {
    if (
      this.status === LeaveStatus.APPROVED ||
      this.status === LeaveStatus.PENDING
    ) {
      this.status = LeaveStatus.CANCELLED;
      this.updatedAt = _time.now();
    } else {
      // I18N_LEAK: domain aggregate (no DI). Caller may translate via 'errors.leaveCancelNotAllowed'.
      throw new InternalServerErrorException('Bu ta\'til so\'rovini bekor qilib bo\'lmaydi');
    }
  }

  static calcWorkDays(start: Date, end: Date): number {
    let days = 0;
    const current = new Date(start);
    while (current <= end) {
      const dow = current.getDay();
      if (dow !== 0 && dow !== 6) {
        days++;
      }
      current.setDate(current.getDate() + 1);
    }
    return days;
  }
}
