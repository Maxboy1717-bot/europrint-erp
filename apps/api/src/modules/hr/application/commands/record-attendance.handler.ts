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

export class RecordAttendanceCommand {
  constructor(public readonly employeeId: number,
    public readonly attendanceDate: string,  // YYYY-MM-DD
    public readonly checkInTime?: Date,
    public readonly checkOutTime?: Date,
    public readonly overtimeMinutes: number = 0,
    public readonly source: string = 'manual') {}
}

@CommandHandler(RecordAttendanceCommand)
export class RecordAttendanceHandler implements ICommandHandler<RecordAttendanceCommand> {
  private readonly logger = new Logger(RecordAttendanceHandler.name);

  constructor(
    @Inject(HR_REPO) private readonly hrRepo: IHrRepo,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: RecordAttendanceCommand): Promise<Result<Record<string, unknown>>> {
      this.logger.debug(`Recording attendance for employee ${command.employeeId}`);

      const result = await this.hrRepo.saveAttendance({
        employeeId: command.employeeId,
        attendanceDate: command.attendanceDate,
        checkInTime: command.checkInTime ?? null,
        checkOutTime: command.checkOutTime ?? null,
        overtimeMinutes: command.overtimeMinutes,
        status: command.checkInTime ? 'present' : 'absent',
        source: command.source,
        createdAt: _time.now(),
        updatedAt: _time.now(),
      });

      if (result.ok) {
        this.eventEmitter.emit('hr.attendance.recorded', {
          employeeId: command.employeeId,
          date: command.attendanceDate,
          recordedAt: _time.now(),
        });
        this.logger.log(`Attendance recorded - Employee: ${command.employeeId}, Date: ${command.attendanceDate}`);
      }

      if (!result.ok) {
        return Err(result.error ?? 'Attendance save failed');
      }
      return Ok(result.data);
  }
}
