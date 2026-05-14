/**
 * @module get-budgets.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { GetBudgetsQuery } from './get-budgets.query';
import { FINANCE_REPO } from '../../domain/repositories/i-finance.repo';
import { IFinanceRepo } from '../../domain/repositories/i-finance.repo';

@QueryHandler(GetBudgetsQuery)
export class GetBudgetsHandler implements IQueryHandler<GetBudgetsQuery> {
  private readonly logger = new Logger(GetBudgetsHandler.name);

  constructor(@Inject(FINANCE_REPO) private readonly repo: IFinanceRepo) {}

  async execute(
    query: GetBudgetsQuery,
  ): Promise<Result<{ items: unknown[]; total: number }>> {
      this.logger.debug('Fetching budgets');

      const result = await this.repo.findBudgets({
        fiscalYear: query.fiscalYear,
        status: query.status,
        department: query.department,
        page: query.page,
        limit: query.limit,
      });

      return result;
  }
}
