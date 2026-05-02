import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger, InternalServerErrorException } from '@nestjs/common';
import { PaginatedResult } from '@common/types/result.type';
import { GetPaymentsQuery } from './get-payments.query';
import { IFinanceRepo, FINANCE_REPO } from '../../domain/repositories/i-finance.repo';

@Injectable()
@QueryHandler(GetPaymentsQuery)
export class GetPaymentsHandler implements IQueryHandler<GetPaymentsQuery> {
  private readonly logger = new Logger(GetPaymentsHandler.name);

  constructor(@Inject(FINANCE_REPO) private readonly financeRepo: IFinanceRepo) {}

  async execute(query: GetPaymentsQuery): Promise<PaginatedResult<Record<string, unknown>>> {
    let result: Awaited<ReturnType<typeof this.financeRepo.findPayments>>;
    try {
      result = await this.financeRepo.findPayments(query.filters);
    } catch (err) {
      this.logger.error(`Failed to fetch payments: ${(err as Error).message}`);
      throw new InternalServerErrorException('Failed to fetch payments');
    }

    if (!result.ok) {
      this.logger.error(`Failed to fetch payments: ${result.error}`);
      throw new InternalServerErrorException('Failed to fetch payments');
    }

    const page = query.filters.page || 1;
    const limit = query.filters.limit || 10;

    this.logger.debug(`Payments fetched: page=${page}, limit=${limit}, total=${result.data.total}`);

    return {
      items: result.data.items,
      total: result.data.total,
      page,
      limit,
    };
  }
}
