import { Injectable, Logger, Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result, Ok as ok, Err as err, isErr, Err } from '@common/result';
import { TransferRequest, RequestStatus } from '../../domain/aggregates/transfer-request.aggregate';
import { IPosV2Repo, POS_V2_REPO } from '../../domain/repositories/i-pos-v2.repo';

export class GetRequestsQuery {
  constructor(public readonly status?: RequestStatus,
    public readonly fromWarehouseId?: string,
    public readonly toWarehouseId?: string,
    public readonly page: number = 1,
    public readonly limit: number = 20) {}
}

@QueryHandler(GetRequestsQuery)
@Injectable()
export class GetRequestsHandler implements IQueryHandler<GetRequestsQuery> {
  private readonly logger = new Logger(GetRequestsHandler.name);

  constructor(@Inject(POS_V2_REPO) private readonly repo: IPosV2Repo) {}

  async execute(
    query: GetRequestsQuery,
  ): Promise<Result<{ data: TransferRequest[]; total: number; page: number; limit: number }>> {
    try {
      const result = await this.repo.findRequests({
        status: query.status,
        fromWarehouseId: query.fromWarehouseId,
        toWarehouseId: query.toWarehouseId,
        page: query.page,
        limit: query.limit,
      });

      if (isErr(result)) {
        this.logger.error('Failed to get requests', result.error);
        return err(result.error);
      }

      return ok(result.data);
    } catch (error: unknown) {
      this.logger.error('Failed to get requests:', error);
      return err({
        message: 'Failed to get requests',
        code: 'GET_REQUESTS_ERROR',
      });
    }
  }
}
