/**
 * @module leave-request.aggregate
 * @description Source module. See exports for details.
 *
 * State-transition methods (approve / reject / cancel) return
 * `Result<void, DomainError>` per Rule 1 (Result Pattern). Constructors and
 * getters may still throw `DomainError` because there is no Result return
 * channel available there.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Result, Ok, Err } from '@common/types/result.type';
import { AppErr } from '@common/result';
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

  approve(approverId: string): Result<void> {
    if (this.status !== LeaveStatus.PENDING) {
      // INVALID_TRANSITION: only PENDING leave requests can be approved.
      // I18N_LEAK: domain aggregate (no DI). Caller may translate via 'errors.onlyPendingApprovable'.
      return Err(AppErr('INVALID_TRANSITION', "Faqat pending so'rov tasdiqlanadi"));
    }
    this.status = LeaveStatus.APPROVED;
    this.approvedBy = approverId;
    this.approvedAt = _time.now();
    this.updatedAt = _time.now();
    return Ok();
  }

  reject(rejectorId: string, reason: string): Result<void> {
    if (this.status !== LeaveStatus.PENDING) {
      // INVALID_TRANSITION: only PENDING leave requests can be rejected.
      // I18N_LEAK: domain aggregate (no DI). Caller may translate via 'errors.onlyPendingRejectable'.
      return Err(AppErr('INVALID_TRANSITION', "Faqat pending so'rov rad etiladi"));
    }
    this.status = LeaveStatus.REJECTED;
    this.rejectedBy = rejectorId;
    this.rejectionReason = reason;
    this.updatedAt = _time.now();
    return Ok();
  }

  cancel(): Result<void> {
    if (
      this.status === LeaveStatus.APPROVED ||
      this.status === LeaveStatus.PENDING
    ) {
      this.status = LeaveStatus.CANCELLED;
      this.updatedAt = _time.now();
      return Ok();
    }
    // INVALID_TRANSITION: cannot cancel from terminal/non-cancellable status.
    // I18N_LEAK: domain aggregate (no DI). Caller may translate via 'errors.leaveCancelNotAllowed'.
    return Err(AppErr('INVALID_TRANSITION', "Bu ta'til so'rovini bekor qilib bo'lmaydi"));
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

