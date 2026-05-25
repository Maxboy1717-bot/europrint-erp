/**
 * @module get-budget-stats.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { GetBudgetStatsQuery } from './get-budget-stats.query';
import { FINANCE_REPO } from '../../domain/repositories/i-finance.repo';
import { IFinanceRepo } from '../../domain/repositories/i-finance.repo';

@QueryHandler(GetBudgetStatsQuery)
export class GetBudgetStatsHandler
  implements IQueryHandler<GetBudgetStatsQuery>
{
  private readonly logger = new Logger(GetBudgetStatsHandler.name);

  constructor(@Inject(FINANCE_REPO) private readonly repo: IFinanceRepo) {}

  async execute(
    query: GetBudgetStatsQuery,
  ): Promise<
    Result<{
      totalBudgets: number;
      approved: number;
      draft: number;
      totalPlanned: number;
      totalActual: number;
      overallVariancePercent: number;
    }>
  > {
      this.logger.debug(
        `Fetching budget stats for fiscal year: ${query.fiscalYear}`,
      );

      const result = await this.repo.getBudgetStats(query.fiscalYear);

      return result;
  }
}
