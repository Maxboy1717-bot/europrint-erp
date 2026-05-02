import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger, InternalServerErrorException } from '@nestjs/common';
import { PaginatedResult } from '@common/types/result.type';
import { GetGlEntriesQuery } from './get-gl-entries.query';
import { IFinanceRepo, FINANCE_REPO } from '../../domain/repositories/i-finance.repo';

@Injectable()
@QueryHandler(GetGlEntriesQuery)
export class GetGlEntriesHandler implements IQueryHandler<GetGlEntriesQuery> {
  private readonly logger = new Logger(GetGlEntriesHandler.name);

  constructor(@Inject(FINANCE_REPO) private readonly financeRepo: IFinanceRepo) {}

  async execute(query: GetGlEntriesQuery): Promise<PaginatedResult<Record<string, unknown>>> {
    let result: Awaited<ReturnType<typeof this.financeRepo.findGlEntries>>;
    try {
      result = await this.financeRepo.findGlEntries(query.filters);
    } catch (err) {
      this.logger.error(`Failed to fetch GL entries: ${(err as Error).message}`);
      throw new InternalServerErrorException('Failed to fetch GL entries');
    }

    if (!result.ok) {
      this.logger.error(`Failed to fetch GL entries: ${result.error}`);
      throw new InternalServerErrorException('Failed to fetch GL entries');
    }

    const page = query.filters.page || 1;
    const limit = query.filters.limit || 10;

    this.logger.debug(`GL entries fetched: page=${page}, limit=${limit}, total=${result.data.total}`);

    return {
      items: result.data.items,
      total: result.data.total,
      page,
      limit,
    };
  }
}
