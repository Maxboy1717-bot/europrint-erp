/**
 * @module hr-attendance.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, Inject, InternalServerErrorException } from '@nestjs/common';
import { IAttendanceRepository, ATTENDANCE_REPO } from '../attendance/i-attendance.repo';
import { Result, safeCall } from '@common/result';

@Injectable()
export class HrAttendanceService {
  private readonly logger = new Logger(HrAttendanceService.name);

  constructor(
    @Inject(ATTENDANCE_REPO) private readonly attendanceRepo: IAttendanceRepository,
  ) {}

  async getTodayAll(): Promise<Result<Record<string, unknown>[]>>{
    return safeCall(async () => {
    const result = await this.attendanceRepo.findTodayAll();
    if (!result.ok) {
      this.logger.error(`getTodayAll failed: ${result.error}`);
      throw new InternalServerErrorException('Davomat ma\'lumotlarini olishda xatolik');
    }
    return result.data;
  
    });}
}
