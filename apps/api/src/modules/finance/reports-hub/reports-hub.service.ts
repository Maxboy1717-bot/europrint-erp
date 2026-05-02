import { Injectable, Logger, Inject } from '@nestjs/common';
import { IReportsHubRepository, REPORTS_HUB_REPO } from './i-reports-hub.repo';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class ReportsHubService {
  private readonly logger = new Logger(ReportsHubService.name);
  constructor(@Inject(REPORTS_HUB_REPO) private readonly repo: IReportsHubRepository) {}

  async getSummary(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const result = await this.repo.getSummary();
    if (!result.ok) {
      this.logger.warn(`getSummary: ${result.error}`);
      return { invoices: { total: 0, paid: 0 }, payments: { total: 0 }, budgets: { total: 0, approved: 0 }, glEntries: { total: 0 } };
    }
    return result.data;
  
    });}
}
