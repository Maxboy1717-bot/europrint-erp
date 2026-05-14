/**
 * @module get-attendance.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { GetAttendanceQuery } from './get-attendance.query';
import { IHrRepo, HR_REPO } from '../../domain/repositories/i-hr.repo';

@Injectable()
@QueryHandler(GetAttendanceQuery)
export class GetAttendanceHandler implements IQueryHandler<GetAttendanceQuery> {
  private readonly logger = new Logger(GetAttendanceHandler.name);

  constructor(@Inject(HR_REPO) private readonly hrRepo: IHrRepo) {}

  async execute(query: GetAttendanceQuery): Promise<Result<object[]>> {
    const result = await this.hrRepo
      .findAttendance(query.employeeId, query.period)
      .catch((err) => ({ ok: false as const, error: (err as Error).message }));

    if (!result.ok) {
      this.logger.error(`Failed to fetch attendance: ${result.error}`);
      return result as Result<object[]>;
    }

    this.logger.debug(`Attendance records fetched for employee ${query.employeeId}: count=${result.data.length}`);

    return { ok: true, data: result.data };
  }
}
