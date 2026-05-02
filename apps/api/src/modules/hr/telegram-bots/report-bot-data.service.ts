import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { Result, AppError, safeCall, Ok } from '@common/result';
import { errMsg } from '../hr-v2-error';
import { ReportBotDataRepository } from './report-bot-data.repository';

@Injectable()
export class ReportBotDataService {
  private readonly logger = new Logger(ReportBotDataService.name);

  constructor(private readonly repo: ReportBotDataRepository) {}

  async getEmployeeInfo(chatId: number): Promise<{ id: number; first_name: string; position?: string } | null> {
    const r = await this.repo.getEmployeeInfo(chatId);
    return (r.ok ? r.data as { id: number; first_name: string; position?: string } | null : null);
  }

  async hasSubmittedToday(employeeId: number): Promise<Result<boolean, AppError>> {
    const today = _time.now().toISOString().split('T')[0];
    const r = await this.repo.hasSubmittedToday(employeeId, today);
    if (!r.ok) return Ok(false);
    return r;
  }

  isDeadlinePassed(): boolean {
    const hour = _time.now().getHours();
    return hour >= 20;
  }

  async saveReport(employeeId: number, reportDate: string, tasksCompleted: string, tomorrowPlan: string, metrics: string) {
    try {
      const hour = _time.now().getHours();
      const isOnTime = hour < 20;

      const inserted = await this.repo.insertDailyReport(employeeId, reportDate, tasksCompleted, tomorrowPlan, metrics);

      if (inserted && isOnTime) {
        await this.repo.addGamificationPoints(employeeId);
      }
    } catch (err) {
      this.logger.warn(`saveReport error: ${errMsg(err)}`);
    }
  }
}
