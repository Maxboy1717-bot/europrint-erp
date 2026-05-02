import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { GetLeaveBalanceQuery } from './get-leave-balance.query';
import { HR_REPO } from '../../domain/repositories/i-hr.repo';
import { IHrRepo } from '../../domain/repositories/i-hr.repo';

@QueryHandler(GetLeaveBalanceQuery)
export class GetLeaveBalanceHandler
  implements IQueryHandler<GetLeaveBalanceQuery>
{
  private readonly logger = new Logger(GetLeaveBalanceHandler.name);

  constructor(@Inject(HR_REPO) private readonly repo: IHrRepo) {}

  async execute(
    query: GetLeaveBalanceQuery,
  ): Promise<
    Result<{
      annual: { used: number; remaining: number; total: number };
      sick: { used: number };
      maternity: { used: number };
    }>
  > {
      this.logger.debug(`Fetching leave balance for employee: ${query.employeeId}`);

      const result = await this.repo.getLeaveBalance(query.employeeId);

      return result;
  }
}
