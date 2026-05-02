import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { GetLeavesQuery } from './get-leaves.query';
import { HR_REPO } from '../../domain/repositories/i-hr.repo';
import { IHrRepo } from '../../domain/repositories/i-hr.repo';

@QueryHandler(GetLeavesQuery)
export class GetLeavesHandler implements IQueryHandler<GetLeavesQuery> {
  private readonly logger = new Logger(GetLeavesHandler.name);

  constructor(@Inject(HR_REPO) private readonly repo: IHrRepo) {}

  async execute(
    query: GetLeavesQuery,
  ): Promise<Result<{ items: unknown[]; total: number }>> {
      this.logger.debug('Fetching leave requests');

      const result = await this.repo.findLeaves({
        employeeId: query.employeeId,
        status: query.status,
        leaveType: query.leaveType,
        page: query.page,
        limit: query.limit,
      });

      return result;
  }
}
