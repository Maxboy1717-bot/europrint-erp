import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Logger } from '@nestjs/common';
import { DomainEvent } from '@shared/domain/domain-event';
import { AttendanceRecordedEvent } from '../events/attendance-recorded.event';

import { MS_PER_MINUTE } from '@common/constants/app.constants';
export interface AttendanceProps {
  id: number;
  employeeId: number;
  departmentId: number;
  checkInTime: Date;
  checkOutTime?: Date;
  status: 'present' | 'absent' | 'late' | 'half_day';
  shiftId?: number;
  overtimeHours: number;
}

export class Attendance {
  private readonly logger = new Logger(Attendance.name);
  private events: DomainEvent[] = [];

  constructor(private props: AttendanceProps) {}

  static create(props: AttendanceProps): Attendance {
    return new Attendance(props);
  }

  get id(): number { return this.props.id; }
  get employeeId(): number { return this.props.employeeId; }
  get status(): string { return this.props.status; }
  get overtimeHours(): number { return this.props.overtimeHours; }

  recordCheckIn(checkInTime: Date): void {
    this.props.checkInTime = checkInTime;
    this.logger.debug(`Check-in recorded for employee ${this.props.employeeId}`);
  }

  recordCheckOut(checkOutTime: Date, overtimeHours: number): void {
    this.props.checkOutTime = checkOutTime;
    this.props.overtimeHours = overtimeHours;
    this.logger.debug(
      `Check-out recorded for employee ${this.props.employeeId}, OT: ${overtimeHours}h`
    );
  }

  determineStatus(lateThreshold: number = 15): 'present' | 'absent' | 'late' | 'half_day' {
    if (!this.props.checkInTime) return 'absent';

    const scheduledTime = new Date(this.props.checkInTime);
    scheduledTime.setHours(9, 0, 0, 0);

    const diffMinutes =
      (this.props.checkInTime.getTime() - scheduledTime.getTime()) / MS_PER_MINUTE;

    if (diffMinutes > lateThreshold) {
      this.props.status = 'late';
    } else if (!this.props.checkOutTime) {
      this.props.status = 'half_day';
    } else {
      this.props.status = 'present';
    }

    return this.props.status;
  }

  emitAttendanceRecorded(): void {
    const event = new AttendanceRecordedEvent({
      attendanceId: this.props.id,
      employeeId: this.props.employeeId,
      departmentId: this.props.departmentId,
      status: this.props.status,
      checkInTime: this.props.checkInTime,
      checkOutTime: this.props.checkOutTime,
      overtimeHours: this.props.overtimeHours,
      recordedAt: _time.now(),
    });
    this.events.push(event);
    this.logger.debug(`Attendance recorded event emitted for employee ${this.props.employeeId}`);
  }

  getDomainEvents(): DomainEvent[] {
    return this.events;
  }

  clearDomainEvents(): void {
    this.events = [];
  }
}
