import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { Result, Err } from '@common/types/result.type';
import { DashboardQueryRepository } from './dashboard-query.repository';

@Injectable()
export class DashboardQueryService {
  private readonly logger = new Logger(DashboardQueryService.name);

  constructor(private readonly repo: DashboardQueryRepository) {}

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
}
