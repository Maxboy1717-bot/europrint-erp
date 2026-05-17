/**
 * LeaveAccrualJobService — orchestrates the monthly accrual run.
 *
 * - Cron: 1st of each month at 02:00 (Tashkent time).
 * - Manual: runForMonth(year, month) for replay / catch-up.
 *
 * Flow:
 *   1) Fetch all active employees with a hire_date.
 *   2) For each employee, compute accrual lines via LeaveAccrualService.
 *   3) For each line, read current balance and upsert with new total / remaining.
 *   4) Return aggregate stats: processed, updated, skipped (no hire_date),
 *      and any errors collected (continue on individual failures).
 */
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TashkentTimeService } from '@common/time';
import { Result, Ok, Err } from '@common/result';
import { IHrLeaveSvcRepository, HR_LEAVE_SVC_REPO } from './i-hr-leave-svc.repo';
import { LeaveAccrualService } from './leave-accrual.service';

const _time = new TashkentTimeService();

export interface AccrualRunResult {
  year: number;
  month: number;
  processed: number;
  updated: number;
  skipped: number;
  errors: number;
}

@Injectable()
export class LeaveAccrualJobService {
  private readonly logger = new Logger(LeaveAccrualJobService.name);

  constructor(
    @Inject(HR_LEAVE_SVC_REPO) private readonly repo: IHrLeaveSvcRepository,
    private readonly accrual: LeaveAccrualService,
  ) {}

  /** Cron entry: 02:00 on the 1st of every month (server time). */
  @Cron('0 2 1 * *')
  async monthlyAccrualCron(): Promise<void> {
    const now   = _time.now();
    const year  = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    const r = await this.runForMonth(year, month);
    if (r.ok) {
      this.logger.log(`Leave accrual ${year}-${month}: processed=${r.data.processed} updated=${r.data.updated} skipped=${r.data.skipped} errors=${r.data.errors}`);
    } else {
      this.logger.error(`Leave accrual ${year}-${month} failed: ${r.error.message}`);
    }
  }

  /**
   * Manual / replay entry.
   * Continues on individual employee failures (collects into `errors`).
   */
  async runForMonth(year: number, month: number): Promise<Result<AccrualRunResult>> {
    if (!Number.isInteger(year)  || year < 2000 || year > 2100) return Err('year noto\'g\'ri');
    if (!Number.isInteger(month) || month < 1   || month > 12)  return Err('month 1..12 oraligida bo\'lishi kerak');

    const empR = await this.repo.listActiveEmployeesWithHireDate();
    if (!empR.ok) return empR as unknown as Result<AccrualRunResult>;

    const list = Array.isArray(empR.data) ? empR.data : [];
    let processed = 0;
    let updated   = 0;
    let skipped   = 0;
    let errors    = 0;

    for (const emp of list) {
      processed += 1;
      if (!emp.hireDate) {
        skipped += 1;
        continue;
      }
      const accrualR = this.accrual.computeAccrual({
        employeeId: emp.id,
        hireDate:   emp.hireDate,
        year,
        month,
      });
      if (!accrualR.ok) {
        errors += 1;
        this.logger.warn(`Accrual compute fail emp=${emp.id}: ${accrualR.error.message}`);
        continue;
      }
      const lines = accrualR.data;
      if (lines.length === 0) {
        // Hire date is in the future relative to this period.
        skipped += 1;
        continue;
      }
      let employeeUpdated = false;
      for (const line of lines) {
        const balR = await this.repo.findBalance(emp.id, line.leaveType, year);
        if (!balR.ok) { errors += 1; continue; }
        const current = balR.data ?? { total_days: 0, used_days: 0, remaining_days: 0 };
        const applied = this.accrual.applyAccrual(
          {
            total_days:     Number((current as Record<string, unknown>)['total_days']     ?? 0),
            used_days:      Number((current as Record<string, unknown>)['used_days']      ?? 0),
            remaining_days: Number((current as Record<string, unknown>)['remaining_days'] ?? 0),
          },
          line,
        );
        const up = await this.repo.upsertBalance({
          employeeId:     emp.id,
          leaveType:      line.leaveType,
          year,
          total_days:     applied.total_days,
          used_days:      applied.used_days,
          remaining_days: applied.remaining_days,
        });
        if (!up.ok) { errors += 1; continue; }
        employeeUpdated = true;
      }
      if (employeeUpdated) updated += 1;
    }

    return Ok({ year, month, processed, updated, skipped, errors });
  }
}
