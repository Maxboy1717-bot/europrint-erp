/**
 * @module discipline-v2-absence.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { errMsg } from "../hr-v2-error";
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { HrV2Events } from '../events/hr-v2-events';
import { DisciplineV2Service } from './discipline-v2.service';
import { safeCall, Result, AppError } from '@common/result';
import { DisciplineV2AbsenceRepository } from './discipline-v2-absence.repository';

import { MS_PER_DAY } from '@common/constants/app.constants';
@Injectable()
export class DisciplineV2AbsenceService {
  private readonly logger = new Logger(DisciplineV2AbsenceService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly violations: DisciplineV2Service,
    private readonly repo: DisciplineV2AbsenceRepository,
  ) {}

  async recordAbsence(employeeId: number, absenceDate: string) {
    const prevRow = await this.repo.getLastAbsence(employeeId);

    let newCount = 1;
    const prevData = (prevRow?.ok ? prevRow.data as { absence_date?: string; consecutive_day_count?: number | string } : null);
    if (prevData?.absence_date) {
      const prevDate = new Date(prevData.absence_date);
      const currentDate = new Date(absenceDate);
      const diffMs = currentDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / MS_PER_DAY);
      if (diffDays === 1) {
        newCount = parseInt(String(prevData.consecutive_day_count ?? '0')) + 1;
      }
    }

    await this.repo.upsertAbsence(employeeId, absenceDate, newCount);

    this.eventEmitter.emit(HrV2Events.ABSENCE_RECORDED, {
      employeeId,
      absenceDate,
      consecutiveCount: newCount,
    });

    if (newCount >= 3) {
      await this.violations.blockEmployee(employeeId, "Avtomatik bloklash: 3 kun ketma-ket yo'qlik", 0);
      this.eventEmitter.emit(HrV2Events.DISCIPLINE_AUTO_BLOCK, {
        employeeId,
        consecutiveCount: newCount,
      });
    }

    return { success: true, consecutiveCount: newCount, autoBlocked: newCount >= 3 };
  }

  async getBlockedEmployees(): Promise<Result<object, AppError>> {
    return this.repo.getBlockedEmployees();
  }

  @Cron('0 1 * * *')
  async expireOldDisciplineRecords() {
    try {
      await this.repo.expireOldDisciplineRecords();
      this.logger.log('✅ ExpireOldDisciplineRecords: done');
    } catch (err) {
      this.logger.error('expireOldDisciplineRecords error', errMsg(err));
    }
  }

  async getEmployeeViolations(employeeId: number) {
    return this.repo.getEmployeeViolations(employeeId);
  }

  async acknowledgeViolation(id: number) {
    return this.repo.acknowledgeViolation(id);
  }

  async approveViolation(id: number, approvedBy?: number) {
    return this.repo.approveViolation(id, approvedBy);
  }

  async checkDisciplineStatus(employeeId: number) {
    return this.repo.checkDisciplineStatus(employeeId);
  }

  async excuseAbsence(absenceId: number, dto: {
    excuseReason: string;
    excuseDocumentUrl?: string;
    excusedBy?: number;
  }) {
    return this.repo.excuseAbsence(absenceId, dto);
  }

  @Cron('0 6 * * *')
  async checkDailyAbsences() {
    try {
      const yesterday = _time.now();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      const rows = await this.repo.findAbsentEmployees(dateStr);

      for (const emp of (rows.ok ? rows.data : [])) {
        try {
          await this.recordAbsence(Number(emp.id), dateStr);
        } catch (absErr: unknown) {
          this.logger.warn(`recordAbsence failed for emp ${emp.id}: ${errMsg(absErr)}`);
        }
      }

      this.logger.log(`✅ CheckDailyAbsences ${dateStr}: ${rows.ok ? rows.data.length : 0} absences processed`);
    } catch (err) {
      this.logger.error('checkDailyAbsences error', errMsg(err));
    }
  }
}
