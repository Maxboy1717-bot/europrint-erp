/**
 * @module attendance.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { AttendanceRepository } from './attendance.repository';
import { securityAttendance } from '@europrint/schemas';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(private readonly repo: AttendanceRepository) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const { page = 1, limit = 10 } = query;
      const r = await this.repo.findAll(Number(page), Number(limit));
      if (!r.ok) throw new Error(r.error.message);
      const { data, total } = r.data as { data: unknown[]; total: number };
      return { data, pagination: { total, page, limit } };
    });
  }

  async findOne(id: number) {
    const row = await this.repo.findOne(id);
    if (!row) throw new NotFoundException(`#${id} topilmadi`);
    return row;
  }

  async create(dto: Record<string, unknown>, _createdBy?: number) {
    return safeCall(async () => {
      this.logger.log(`attendance: yaratilmoqda`);
      const row: Omit<typeof securityAttendance.$inferInsert, 'id'> = {
        employeeId: (dto['employeeId'] as string | undefined) ?? '',
        eventType: (dto['eventType'] as string | undefined) ?? 'entry',
        timestamp: (dto['timestamp'] as Date | undefined) ?? _time.now(),
        gateId: dto['gateId'] as string | undefined,
        method: (dto['method'] as string | undefined) ?? 'manual',
      };
      return this.repo.create(row as typeof securityAttendance.$inferInsert);
    });
  }

  async update(id: number, dto: Record<string, unknown>) {
    return safeCall(async () => {
      this.logger.log(`attendance: yangilanmoqda`);
      await this.findOne(id);
      return this.repo.update(id, dto as Partial<typeof securityAttendance.$inferInsert>);
    });
  }

  async remove(id: number) {
    return safeCall(async () => {
      this.logger.log(`attendance: o'chirilmoqda`);
      await this.findOne(id);
      await this.repo.remove(id);
      return { message: 'O\'chirildi' };
    });
  }
}
