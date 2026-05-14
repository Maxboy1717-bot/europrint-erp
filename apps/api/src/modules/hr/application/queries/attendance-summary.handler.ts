/**
 * @module attendance-summary.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { HrRepository } from '../../infrastructure/repositories/drizzle-hr.repo';
import { Result, Ok } from '@common/result';

export class AttendanceSummaryQuery {
  private readonly logger = new Logger(AttendanceSummaryQuery.name);

  constructor(public readonly employeeId: number,
    public readonly month: number,
    public readonly year: number) {}
}

export interface AttendanceSummaryResult {
  employeeId: number;
  month: string;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  totalOvertimeHours: number;
  attendanceRate: number;
}

@QueryHandler(AttendanceSummaryQuery)
export class AttendanceSummaryHandler implements IQueryHandler<AttendanceSummaryQuery> {
  private logger = new Logger('AttendanceSummaryHandler');

  constructor(private hrRepo: HrRepository) {}

  async execute(query: AttendanceSummaryQuery): Promise<Result<AttendanceSummaryResult>> {
      this.logger.debug(
        `Fetching attendance summary for employee ${query.employeeId}, ${query.month}/${query.year}`
      );

      const startDate = new Date(query.year, query.month - 1, 1);
      const endDate = new Date(query.year, query.month, 0);

      const records = await this.hrRepo.getAttendanceByPeriod(
        query.employeeId,
        startDate,
        endDate
      );

      const summary = {
        presentDays: records.filter((r: Record<string, unknown>) => r.status === 'present').length,
        absentDays: records.filter((r: Record<string, unknown>) => r.status === 'absent').length,
        lateDays: records.filter((r: Record<string, unknown>) => r.status === 'late').length,
        halfDays: records.filter((r: Record<string, unknown>) => r.status === 'half_day').length,
        totalOvertimeHours: records.reduce((sum: number, r: Record<string, unknown>) => sum + Number(r.overtimeHours || 0), 0),
      };

      const workingDays = this.getWorkingDays(query.month, query.year);
      const attendanceRate = (summary.presentDays / workingDays) * 100;

      this.logger.log(
        `Attendance summary - Employee: ${query.employeeId}, Rate: ${attendanceRate.toFixed(2)}%`
      );

      return Ok({
        employeeId: query.employeeId,
        month: `${query.month}/${query.year}`,
        ...summary,
        attendanceRate: Math.min(100, attendanceRate),
      });
  }

  private getWorkingDays(month: number, year: number): number {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    let count = 0;

    for (let i = firstDay.getDate(); i <= lastDay.getDate(); i++) {
      const date = new Date(year, month - 1, i);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
    }

    return count;
  }
}
