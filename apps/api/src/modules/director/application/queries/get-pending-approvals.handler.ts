import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { ApprovalRequest } from '../../domain/aggregates/approval-request.aggregate';
import { APPROVAL_REPO, IApprovalRepo } from '../../domain/repositories/i-approval.repo';
import { GetPendingApprovalsQuery } from './get-pending-approvals.query';

@QueryHandler(GetPendingApprovalsQuery)
export class GetPendingApprovalsHandler
  implements IQueryHandler<GetPendingApprovalsQuery>
{
  private readonly logger = new Logger(GetPendingApprovalsHandler.name);

  constructor(@Inject(APPROVAL_REPO) private readonly approvalRepo: IApprovalRepo) {}

  async execute(
    query: GetPendingApprovalsQuery,
  ): Promise<Result<{ items: ApprovalRequest[]; total: number }>> {
    const result = await this.approvalRepo.findPending({
      documentType: query.documentType,
      page: query.page,
      limit: query.limit,
    });

    if (!result.ok) {
      this.logger.error(`Pending so'rovlar yuklanishida xatolik: ${result.error}`);
    }

    return result;
  }
}
