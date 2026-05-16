/**
 * @module dashboard-query.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, Err } from '@common/types/result.type';
import { DASHBOARD_QUERY_REPO, type IDashboardQueryRepo } from '../domain/repositories/i-dashboard-query.repo';

@Injectable()
export class DashboardQueryService {
  private readonly logger = new Logger(DashboardQueryService.name);

  constructor(@Inject(DASHBOARD_QUERY_REPO) private readonly repo: IDashboardQueryRepo) {}

  async getActivePoCount(): Promise<Result<number>> {
    try {
      return await this.repo.getActivePoCount();
    } catch (err) {
      this.logger.error(`Active PO count error: ${err}`);
      return Err('Active PO count error');
    }
  }

  async getCompletedTodayCount(today: Date): Promise<Result<number>> {
    try {
      return await this.repo.getCompletedTodayCount(today);
    } catch (err) {
      this.logger.error(`Completed today count error: ${err}`);
      return Err('Completed today count error');
    }
  }

  async getAverageOee(): Promise<Result<number>> {
    try {
      return await this.repo.getAverageOee();
    } catch (err) {
      this.logger.error(`Average OEE error: ${err}`);
      return Err('Average OEE error');
    }
  }

  async getMonthlyRevenue(startDate: Date, endDate?: Date): Promise<Result<number>> {
    try {
      return await this.repo.getMonthlyRevenue(startDate, endDate || _time.now());
    } catch (err) {
      this.logger.error(`Monthly revenue error: ${err}`);
      return Err('Monthly revenue error');
    }
  }

  async getTopUnpaidInvoices(): Promise<Result<Array<{ invoiceId: string; amount: number; daysOverdue: number }>>> {
    try {
      return await this.repo.getTopUnpaidInvoices();
    } catch (err) {
      this.logger.error(`Top unpaid invoices error: ${err}`);
      return Err('Top unpaid invoices error');
    }
  }

  async getAdvancePending(): Promise<Result<number>> {
    try {
      return await this.repo.getAdvancePending();
    } catch (err) {
      this.logger.error(`Advance pending error: ${err}`);
      return Err('Advance pending error');
    }
  }

  async getAttendanceToday(today: Date): Promise<Result<{ attended: number; total: number }>> {
    try {
      return await this.repo.getAttendanceToday(today);
    } catch (err) {
      this.logger.error(`Attendance today error: ${err}`);
      return Err('Attendance today error');
    }
  }

  async getOpenPayrollCount(): Promise<Result<number>> {
    try {
      return await this.repo.getOpenPayrollCount();
    } catch (err) {
      this.logger.error(`Open payroll count error: ${err}`);
      return Err('Open payroll count error');
    }
  }

  async getProductionSummary() {
    const today = _time.now();
    today.setHours(0, 0, 0, 0);
    const [activePoResult, completedTodayResult, avgOeeResult] = await Promise.all([
      this.getActivePoCount(),
      this.getCompletedTodayCount(today),
      this.getAverageOee(),
    ]);
    return {
      activePoCount:  activePoResult.ok   ? activePoResult.data   : 0,
      completedToday: completedTodayResult.ok ? completedTodayResult.data : 0,
      avgOee:         avgOeeResult.ok     ? avgOeeResult.data     : 0,
      generatedAt:    _time.now(),
    };
  }

  async getFinanceSummary() {
    const now              = _time.now();
    const lastMonthStart   = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd     = new Date(now.getFullYear(), now.getMonth(), 0);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [currentRevenueResult, lastMonthRevenueResult, topUnpaidResult, advancePendingResult] =
      await Promise.all([
        this.getMonthlyRevenue(currentMonthStart),
        this.getMonthlyRevenue(lastMonthStart, lastMonthEnd),
        this.getTopUnpaidInvoices(),
        this.getAdvancePending(),
      ]);

    const currentRevenue   = currentRevenueResult.ok   ? currentRevenueResult.data   : 0;
    const lastMonthRevenue = lastMonthRevenueResult.ok ? lastMonthRevenueResult.data : 0;
    const revenueVsLastMonth = lastMonthRevenue > 0
      ? Math.round(((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    return {
      revenueVsLastMonth,
      topUnpaidInvoices: topUnpaidResult.ok ? topUnpaidResult.data : [],
      advancePending:    advancePendingResult.ok ? advancePendingResult.data : 0,
      generatedAt:       _time.now(),
    };
  }

  async getHrSummary() {
    const today = _time.now();
    today.setHours(0, 0, 0, 0);
    const [attendanceTodayResult, openPayrollResult] = await Promise.all([
      this.getAttendanceToday(today),
      this.getOpenPayrollCount(),
    ]);
    return {
      attendanceToday:  attendanceTodayResult.ok ? attendanceTodayResult.data : { attended: 0, total: 0 },
      openPayrollCount: openPayrollResult.ok ? openPayrollResult.data : 0,
      generatedAt:      _time.now(),
    };
  }
}
