/**
 * @module leave-request.aggregate
 * @description LeaveRequest aggregate root.
 *
 * Rule 1 (Result Pattern): state-transition methods (`approve` / `reject` /
 * `cancel`) return `Result<void, DomainError>` and emit domain events on
 * success. Constructors are still allowed to throw for malformed input
 * because they have no Result channel.
 *
 * Encapsulation: fields are stored in a private `props` bag (Attendance /
 * Employee aggregate pattern). External callers read via getters; writes
 * only happen via the transition methods. This closes the "anemic domain"
 * grade D- finding from the 2026-05-16 HR audit.
 *
 * Domain events: emitted via the internal `events: DomainEvent[]` buffer.
 * Handlers drain the buffer with `getDomainEvents()` after a successful
 * transition + persistence, then `clearDomainEvents()` and forward each
 * event to `EventEmitter2` (or the CQRS event bus). See
 * `apps/api/src/modules/hr/application/commands/*-leave.handler.ts`.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Logger } from '@nestjs/common';
import { Result, Ok, Err } from '@common/types/result.type';
import { AppErr } from '@common/result';
import { DomainEvent } from '@shared/domain/domain-event';
import { LeaveApprovedEvent } from '../events/leave-approved.event';
import { LeaveRejectedEvent } from '../events/leave-rejected.event';
import { LeaveCancelledEvent } from '../events/leave-cancelled.event';

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

export interface LeaveRequestProps {
  id: string;
  employeeId: string;
  userId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  daysRequested: number;
  status: LeaveStatus;
  reason: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class LeaveRequest {
  private readonly logger = new Logger(LeaveRequest.name);
  private events: DomainEvent[] = [];
  private readonly props: LeaveRequestProps;

  /**
   * Back-compat positional constructor — preserves the historic 15-arg
   * signature used by handlers and `create-leave-request.handler`. Prefer
   * `LeaveRequest.fromProps(props)` for new code.
   */
  constructor(
    id: string,
    employeeId: string,
    userId: string,
    leaveType: LeaveType,
    startDate: Date,
    endDate: Date,
    daysRequested: number,
    status: LeaveStatus,
    reason: string,
    approvedBy: string | null,
    approvedAt: Date | null,
    rejectedBy: string | null,
    rejectionReason: string | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.props = {
      id, employeeId, userId, leaveType, startDate, endDate, daysRequested,
      status, reason, approvedBy, approvedAt, rejectedBy, rejectionReason,
      createdAt, updatedAt,
    };
  }

  static fromProps(props: LeaveRequestProps): LeaveRequest {
    return new LeaveRequest(
      props.id, props.employeeId, props.userId, props.leaveType,
      props.startDate, props.endDate, props.daysRequested, props.status,
      props.reason, props.approvedBy, props.approvedAt, props.rejectedBy,
      props.rejectionReason, props.createdAt, props.updatedAt,
    );
  }

  // ─── Getters (immutable read surface) ────────────────────────────────────
  get id(): string { return this.props.id; }
  get employeeId(): string { return this.props.employeeId; }
  get userId(): string { return this.props.userId; }
  get leaveType(): LeaveType { return this.props.leaveType; }
  get startDate(): Date { return this.props.startDate; }
  get endDate(): Date { return this.props.endDate; }
  get daysRequested(): number { return this.props.daysRequested; }
  get status(): LeaveStatus { return this.props.status; }
  get reason(): string { return this.props.reason; }
  get approvedBy(): string | null { return this.props.approvedBy; }
  get approvedAt(): Date | null { return this.props.approvedAt; }
  get rejectedBy(): string | null { return this.props.rejectedBy; }
  get rejectionReason(): string | null { return this.props.rejectionReason; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  get isActive(): boolean {
    return (
      this.props.status === LeaveStatus.APPROVED &&
      _time.now() >= this.props.startDate &&
      _time.now() <= this.props.endDate
    );
  }

  // ─── State transitions ──────────────────────────────────────────────────
  approve(approverId: string): Result<void> {
    if (this.props.status !== LeaveStatus.PENDING) {
      // INVALID_TRANSITION: only PENDING leave requests can be approved.
      // I18N_LEAK: domain aggregate (no DI). Caller may translate via 'errors.onlyPendingApprovable'.
      return Err(AppErr('INVALID_TRANSITION', "Faqat pending so'rov tasdiqlanadi"));
    }
    const now = _time.now();
    this.props.status = LeaveStatus.APPROVED;
    this.props.approvedBy = approverId;
    this.props.approvedAt = now;
    this.props.updatedAt = now;
    this.events.push(new LeaveApprovedEvent({
      leaveId: this.props.id,
      employeeId: this.props.employeeId,
      userId: this.props.userId,
      approverId,
      approvedAt: now,
    }));
    return Ok();
  }

  reject(rejectorId: string, reason: string): Result<void> {
    if (this.props.status !== LeaveStatus.PENDING) {
      // INVALID_TRANSITION: only PENDING leave requests can be rejected.
      // I18N_LEAK: domain aggregate (no DI). Caller may translate via 'errors.onlyPendingRejectable'.
      return Err(AppErr('INVALID_TRANSITION', "Faqat pending so'rov rad etiladi"));
    }
    const now = _time.now();
    this.props.status = LeaveStatus.REJECTED;
    this.props.rejectedBy = rejectorId;
    this.props.rejectionReason = reason;
    this.props.updatedAt = now;
    this.events.push(new LeaveRejectedEvent({
      leaveId: this.props.id,
      employeeId: this.props.employeeId,
      userId: this.props.userId,
      rejectorId,
      reason,
      rejectedAt: now,
    }));
    return Ok();
  }

  cancel(): Result<void> {
    const previous = this.props.status;
    if (previous === LeaveStatus.APPROVED || previous === LeaveStatus.PENDING) {
      const now = _time.now();
      this.props.status = LeaveStatus.CANCELLED;
      this.props.updatedAt = now;
      this.events.push(new LeaveCancelledEvent({
        leaveId: this.props.id,
        employeeId: this.props.employeeId,
        userId: this.props.userId,
        cancelledAt: now,
        previousStatus: previous === LeaveStatus.APPROVED ? 'approved' : 'pending',
      }));
      return Ok();
    }
    // INVALID_TRANSITION: cannot cancel from terminal/non-cancellable status.
    // I18N_LEAK: domain aggregate (no DI). Caller may translate via 'errors.leaveCancelNotAllowed'.
    return Err(AppErr('INVALID_TRANSITION', "Bu ta'til so'rovini bekor qilib bo'lmaydi"));
  }

  // ─── Event buffer plumbing ───────────────────────────────────────────────
  getDomainEvents(): DomainEvent[] {
    return this.events;
  }

  clearDomainEvents(): void {
    this.events = [];
  }

  // ─── Static helpers ─────────────────────────────────────────────────────
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
