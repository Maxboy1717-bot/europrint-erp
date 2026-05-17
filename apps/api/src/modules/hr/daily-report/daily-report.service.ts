import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { HrV2Events } from '../events/hr-v2-events';
import { safeCall, Result, AppError } from '@common/result';
import { DailyReportRepository } from './daily-report.repository';

@Injectable()
export class DailyReportService {
  private readonly logger = new Logger(DailyReportService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly repo: DailyReportRepository,
  ) {}

  async submitReport(dto: {
    employeeId: number;
    reportDate?: string;
    tasksCompleted?: string;
    metrics?: string;
    tomorrowPlan?: string;
  }) {
    return safeCall(async () => {
      const reportDate = dto.reportDate || _time.now().toISOString().split('T')[0];
      const tasksCompleted = dto.tasksCompleted || '';

      const row = await this.repo.upsertReport({
        employeeId: dto.employeeId,
        reportDate,
        tasksCompleted,
        metrics: dto.metrics,
        tomorrowPlan: dto.tomorrowPlan,
      });

      const rowData = (row?.ok ? row.data as { id?: number } : {});
      this.eventEmitter.emit(HrV2Events.DAILY_REPORT_SUBMITTED, {
        employeeId: dto.employeeId,
        reportDate,
        reportId: rowData?.id,
      });

      return row;
    });
  }

  async hrOverride(reportId: number, hrUserId: number, reason: string, newStatus?: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const previousStatus = await this.repo.getReportStatus(reportId);
      const updatedRow = await this.repo.updateReportStatus(reportId, newStatus || 'submitted');
      if (!updatedRow) throw new NotFoundException(`Report #${reportId} not found`);
      await this.repo.insertAudit(reportId, hrUserId, (previousStatus.ok ? previousStatus.data as string : undefined) as string, newStatus || 'submitted', reason);
      return updatedRow;
    });
  }

  async getStats(date?: string) {
    return safeCall(async () => {
      const reportDate = date || _time.now().toISOString().split('T')[0];
      return this.repo.getStats(reportDate);
    });
  }

  async getByEmployee(employeeId: number, limit = 30) {
    return this.repo.getByEmployee(employeeId, limit);
  }

  async getByDate(date: string, type: 'all' | 'operator' | 'office' = 'all', limit = 100) {
    return this.repo.getByDate(date, type, limit);
  }

  async getByDepartment(departmentId: number, date: string) {
    return this.repo.getByDepartment(departmentId, date);
  }

  @Cron('0 17 * * 1-6')
  async sendDailyReportReminder() {
    return safeCall(async () => {
      const today = _time.now().toISOString().split('T')[0];
      const BATCH = 100;
      let offset = 0;
      let totalNotified = 0;

      while (true) {
        const rows = await this.repo.findEmployeesWithoutReport(today, BATCH, offset);
        if (!rows.ok || rows.data.length === 0) break;

        for (const emp of rows.data) {
          this.eventEmitter.emit(HrV2Events.DAILY_REPORT_REMINDER, {
            employeeId: emp.id,
            reportDate: today,
          });
        }
        totalNotified += rows.data.length;
        if (rows.data.length < BATCH) break;
        offset += BATCH;
      }
      this.logger.log(`DailyReport reminder: ${totalNotified} employees notified`);
    });
  }

  @Cron('0 20 * * 1-6')
  async markAbsentReports() {
    return safeCall(async () => {
      const today = _time.now().toISOString().split('T')[0];
      await this.repo.markAbsentForDate(today);
      this.logger.log(`markAbsentReports: processed ${today}`);

      // 3-hour escalation: reminder was sent at 17:00; deadline is 20:00 (3h window).
      // Query current stats to get absent count, then escalate to HR.
      const statsR = await this.repo.getStats(today);
      const absentCount = statsR.ok
        ? (statsR.data as { absent_count?: number }).absent_count ?? 0
        : 0;
      this.eventEmitter.emit(HrV2Events.DAILY_REPORT_OVERDUE, {
        reportDate:  today,
        absentCount,
        escalatedAt: _time.now().toISOString(),
      });
    });
  }
}
