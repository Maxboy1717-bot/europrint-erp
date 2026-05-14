/**
 * @module attendance-recorded.event
 * @description Domain event payload. Emitted via @nestjs/event-emitter or CQRS event bus.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface AttendanceRecordedEventProps {
  attendanceId: number;
  employeeId: number;
  departmentId: number;
  status: 'present' | 'absent' | 'late' | 'half_day';
  checkInTime: Date;
  checkOutTime?: Date;
  overtimeHours: number;
  recordedAt: Date;
}

export class AttendanceRecordedEvent extends DomainEvent {
  constructor(public readonly props: AttendanceRecordedEventProps) {
    super(String(props.employeeId), 'AttendanceRecorded');
  }
}
