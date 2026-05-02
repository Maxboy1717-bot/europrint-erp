import { AppErr, Err, Ok, Result, isErr } from '@common/result';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ILeadRepository } from '../../domain/repositories/i-lead.repo';
import { Lead } from '../../domain/aggregates/lead.aggregate';

interface PaginatedLeads {
  data: Lead[];
  pagination: { limit: number; offset: number; total: number };
}

export class ListLeadsQuery {
  constructor(
    public readonly companyId: number,
    public readonly limit: number = 20,
    public readonly offset: number = 0,
    public readonly status?: string,
  ) {}
}

@QueryHandler(ListLeadsQuery)
export class ListLeadsHandler implements IQueryHandler<ListLeadsQuery> {
  private readonly logger = new Logger(ListLeadsHandler.name);

  constructor(
    @Inject('ILeadRepository') private readonly leadRepo: ILeadRepository,
  ) {}

  async execute(query: ListLeadsQuery): Promise<Result<PaginatedLeads>> {
    this.logger.debug(`Fetching leads companyId=${query.companyId} limit=${query.limit}`);

    const result = query.status
      ? await this.leadRepo.findByStatus(query.status, query.limit, query.offset)
      : await this.leadRepo.findByCompanyId(query.companyId, query.limit, query.offset);

    if (isErr(result)) {
      this.logger.error(`Failed to fetch leads: ${result.error.message}`);
      return Err(AppErr('INTERNAL', 'Failed to fetch leads'));
    }

    const countResult = await this.leadRepo.count();
    const total = countResult.ok ? (countResult.data ?? 0) : 0;

    return Ok({
      data: result.data ?? [],
      pagination: { limit: query.limit, offset: query.offset, total },
    });
  }
}
