/**
 * @module get-payments.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { PaginatedResult, Result, Ok, Err, AppErr } from '@common/types/result.type';
import { GetPaymentsQuery } from './get-payments.query';
import { IFinanceRepo, FINANCE_REPO } from '../../domain/repositories/i-finance.repo';

@Injectable()
@QueryHandler(GetPaymentsQuery)
export class GetPaymentsHandler implements IQueryHandler<GetPaymentsQuery> {
  private readonly logger = new Logger(GetPaymentsHandler.name);

  constructor(@Inject(FINANCE_REPO) private readonly financeRepo: IFinanceRepo) {}

  async execute(query: GetPaymentsQuery): Promise<Result<PaginatedResult<Record<string, unknown>>>> {
    let result: Awaited<ReturnType<typeof this.financeRepo.findPayments>>;
    try {
      result = await this.financeRepo.findPayments(query.filters);
    } catch (err) {
      this.logger.error(`Failed to fetch payments: ${(err as Error).message}`);
      return Err(AppErr('INTERNAL', 'Failed to fetch payments'));
    }

    if (!result.ok) {
      this.logger.error(`Failed to fetch payments: ${result.error}`);
      return Err(AppErr('INTERNAL', 'Failed to fetch payments'));
    }

    const page = query.filters.page || 1;
    const limit = query.filters.limit || 10;

    this.logger.debug(`Payments fetched: page=${page}, limit=${limit}, total=${result.data.total}`);

    return Ok({
      items: result.data.items,
      total: result.data.total,
      page,
      limit,
    });
  }
}
