import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { ApprovalRequest } from '../../domain/aggregates/approval-request.aggregate';
import { APPROVAL_REPO, IApprovalRepo } from '../../domain/repositories/i-approval.repo';
import { GetApprovalHistoryQuery } from './get-approval-history.query';

@QueryHandler(GetApprovalHistoryQuery)
export class GetApprovalHistoryHandler
  implements IQueryHandler<GetApprovalHistoryQuery>
{
  private readonly logger = new Logger(GetApprovalHistoryHandler.name);

  constructor(@Inject(APPROVAL_REPO) private readonly approvalRepo: IApprovalRepo) {}

  async execute(
    query: GetApprovalHistoryQuery,
  ): Promise<Result<{ items: ApprovalRequest[]; total: number }>> {
    const result = await this.approvalRepo.findHistory({
      documentType: query.documentType,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });

    if (!result.ok) {
      this.logger.error(`Tarixni yuklanishida xatolik: ${result.error}`);
    }

    return result;
  }
}
