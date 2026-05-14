/**
 * @module get-lead-by-id.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { ILeadRepository } from '../../domain/repositories/i-lead.repo';

export class GetLeadByIdQuery {
  private readonly logger = new Logger(GetLeadByIdQuery.name);
  constructor(public readonly leadId: number) {}
}

@QueryHandler(GetLeadByIdQuery)
export class GetLeadByIdHandler implements IQueryHandler<GetLeadByIdQuery> {
  private readonly logger = new Logger(GetLeadByIdHandler.name);

  constructor(
    @Inject('ILeadRepository') private readonly leadRepo: ILeadRepository,
  ) {}

  async execute(query: GetLeadByIdQuery): Promise<Result<Record<string, unknown>>> {
    this.logger.debug({ msg: 'Fetching lead by id', leadId: query.leadId });

    const result = await this.leadRepo.findById(query.leadId);
    if (!result.ok || !result.data) {
      this.logger.warn({ msg: 'Lead not found', leadId: query.leadId });
      return Err(AppErr('NOT_FOUND', 'Lead not found'));
    }

    const lead = result.data;
    return Ok({
      id: lead.getId(),
      status: lead.getStatus(),
      aiScore: lead.getAiScore(),
      companyId: lead.getCompanyId(),
    });
  }
}
