/**
 * @module get-invoices.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { PaginatedResult, Result, Ok, Err, AppErr } from '@common/types/result.type';
import { GetInvoicesQuery } from './get-invoices.query';
import { IFinanceRepo, FINANCE_REPO } from '../../domain/repositories/i-finance.repo';

@Injectable()
@QueryHandler(GetInvoicesQuery)
export class GetInvoicesHandler implements IQueryHandler<GetInvoicesQuery> {
  private readonly logger = new Logger(GetInvoicesHandler.name);

  constructor(@Inject(FINANCE_REPO) private readonly financeRepo: IFinanceRepo) {}

  async execute(query: GetInvoicesQuery): Promise<Result<PaginatedResult<Record<string, unknown>>>> {
    let result: Awaited<ReturnType<typeof this.financeRepo.findInvoices>>;
    try {
      result = await this.financeRepo.findInvoices(query.filters);
    } catch (err) {
      this.logger.error(`Failed to fetch invoices: ${(err as Error).message}`);
      return Err(AppErr('INTERNAL', 'Failed to fetch invoices'));
    }

    if (!result.ok) {
      this.logger.error(`Failed to fetch invoices: ${result.error}`);
      return Err(AppErr('INTERNAL', 'Failed to fetch invoices'));
    }

    const page = query.filters.page || 1;
    const limit = query.filters.limit || 10;

    this.logger.debug(`Invoices fetched: page=${page}, limit=${limit}, total=${result.data.total}`);

    return Ok({
      items: result.data.items,
      total: result.data.total,
      page,
      limit,
    });
  }
}
