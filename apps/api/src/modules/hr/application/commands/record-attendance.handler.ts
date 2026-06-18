/**
 * @module record-attendance.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Result, Ok, Err } from '@common/result';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HR_REPO, IHrRepo } from '../../domain/repositories/i-hr.repo';
import {
  ATTENDANCE_LATE_GRACE_MINUTES,
  DISCIPLINE_LATE_WARNING_THRESHOLD,
  DISCIPLINE_LATE_REPRIMAND_THRESHOLD,
  DISCIPLINE_LATE_DISCHARGE_THRESHOLD,
} from '@common/constants/business.constants';
import { DisciplineRecordRepository } from '../../attendance/discipline-record.repository';

export class RecordAttendanceCommand {
  constructor(public readonly employeeId: number,
    public readonly attendanceDate: string,  // YYYY-MM-DD
    public readonly checkInTime?: Date,
    public readonly checkOutTime?: Date,
    public readonly overtimeMinutes: number = 0,
    public readonly source: string = 'manual',
    // ISO time string HH:MM for the scheduled shift start (e.g. "08:00")
    public readonly scheduledStartTime?: string) {}
}

// Classify attendance status per vision spec:
//   absent   → no checkIn
//   late     → checkIn > scheduledStart + GRACE_MINUTES
//   present  → otherwise
function classifyAttendanceStatus(
  checkInTime?: Date,
  scheduledStartTime?: string,
  attendanceDate?: string,
): string {
  if (!checkInTime) return 'absent';
  if (!scheduledStartTime || !attendanceDate) return 'present';
  const [hh, mm] = scheduledStartTime.split(':').map(Number);
  if (isNaN(hh) || isNaN(mm)) return 'present';
  const scheduled = new Date(`${attendanceDate}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`);
  const diffMinutes = (checkInTime.getTime() - scheduled.getTime()) / 60_000;
  return diffMinutes > ATTENDANCE_LATE_GRACE_MINUTES ? 'late' : 'present';
}

// Map late count to discipline type per vision spec: 0–2=none, 3–4=warning, 5–7=reprimand, 8+=discharge
function disciplineTypeForLateCount(count: number): string | null {
  if (count >= DISCIPLINE_LATE_DISCHARGE_THRESHOLD) return 'discharge';
  if (count >= DISCIPLINE_LATE_REPRIMAND_THRESHOLD) return 'reprimand';
  if (count >= DISCIPLINE_LATE_WARNING_THRESHOLD)   return 'warning';
  return null;
}

@CommandHandler(RecordAttendanceCommand)
export class RecordAttendanceHandler implements ICommandHandler<RecordAttendanceCommand> {
  private readonly logger = new Logger(RecordAttendanceHandler.name);

  constructor(
    @Inject(HR_REPO) private readonly hrRepo: IHrRepo,
    private readonly eventEmitter: EventEmitter2,
    private readonly disciplineRepo: DisciplineRecordRepository,
  ) {}

  async execute(command: RecordAttendanceCommand): Promise<Result<Record<string, unknown>>> {
      this.logger.debug(`Recording attendance for employee ${command.employeeId}`);

      const status = classifyAttendanceStatus(
        command.checkInTime,
        command.scheduledStartTime,
        command.attendanceDate,
      );

      const result = await this.hrRepo.saveAttendance({
        employeeId: command.employeeId,
        attendanceDate: command.attendanceDate,
        checkInTime: command.checkInTime ?? null,
        checkOutTime: command.checkOutTime ?? null,
        overtimeMinutes: command.overtimeMinutes,
        status,
        source: command.source,
        createdAt: _time.now(),
        updatedAt: _time.now(),
      });

      if (!result.ok) {
        return Err(result.error ?? 'Attendance save failed');
      }

      // fire-and-forget: no listener by design (owner decision 2026-06-06)
      this.eventEmitter.emit('hr.attendance.recorded', {
        employeeId: command.employeeId,
        date: command.attendanceDate,
        status,
        recordedAt: _time.now(),
      });
      this.logger.log(`Attendance recorded - Employee: ${command.employeeId}, Date: ${command.attendanceDate}, Status: ${status}`);

      // Auto-discipline when monthly late threshold is crossed (vision spec §discipline)
      if (status === 'late') {
        const [yearStr, monthStr] = command.attendanceDate.split('-');
        const year  = parseInt(yearStr ?? '0', 10);
        const month = parseInt(monthStr ?? '0', 10);
        if (year && month) {
          const lateCount   = await this.hrRepo.getMonthlyLateCount(command.employeeId, year, month);
          const disciplineType = disciplineTypeForLateCount(lateCount);
          if (disciplineType) {
            const today = command.attendanceDate;
            await this.disciplineRepo.insert({
              employeeId:     command.employeeId,
              violationType:  'late_arrival',
              disciplineType,
              description:    `Oyda ${lateCount} marta kech kelindi (avtomatik — vizyon §intizom)`,
              violationDate:  today,
              issuedDate:     today,
              severity:       disciplineType === 'discharge' ? 'high' : disciplineType === 'reprimand' ? 'medium' : 'low',
              issuedBy:       0,   // system-generated; 0 = HR system
              status:         'active',
            });
            this.logger.warn(
              `Discipline auto-created: employee=${command.employeeId} lateCount=${lateCount} type=${disciplineType}`,
            );
          }
        }
      }

      return Ok(result.data);
  }
}
