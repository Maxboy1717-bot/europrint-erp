import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Ok, Result } from '@common/result';
import { ILeadRepository } from '../../domain/repositories/i-lead.repo';

export class CrmPipelineQuery {
  private readonly logger = new Logger(CrmPipelineQuery.name);
  constructor(public readonly companyId: number,
    public readonly limit: number = 100) {}
}

@QueryHandler(CrmPipelineQuery)
export class CrmPipelineHandler implements IQueryHandler<CrmPipelineQuery> {
  private readonly logger = new Logger(CrmPipelineHandler.name);

  constructor(
    @Inject('ILeadRepository') private readonly leadRepo: ILeadRepository,
  ) {}

  async execute(query: CrmPipelineQuery): Promise<Result<Record<string, unknown>>> {
    this.logger.debug({ msg: 'Fetching CRM pipeline', companyId: query.companyId });

    const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'];
    const pipeline: Record<string, unknown[]> = {};

    for (const status of statuses) {
      const result = await this.leadRepo.findByStatus(status, query.limit, 0);
      if (result.ok) {
        pipeline[status] = result.data || [];
      }
    }

    return Ok({
      companyId: query.companyId,
      pipeline,
      summary: {
        total: Object.values(pipeline).reduce((acc, arr) => acc + arr.length, 0),
        converted: pipeline['converted']?.length || 0,
        lost: pipeline['lost']?.length || 0,
      },
    });
  }
}
