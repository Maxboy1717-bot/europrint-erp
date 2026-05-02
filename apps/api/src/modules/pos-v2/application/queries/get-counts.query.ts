import { Injectable, Logger, Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result, Ok as ok, Err as err, isErr, Err } from '@common/result';
import { InventoryCount, CountStatus } from '../../domain/aggregates/inventory-count.aggregate';
import { IPosV2Repo, POS_V2_REPO } from '../../domain/repositories/i-pos-v2.repo';

export class GetCountsQuery {
  constructor(public readonly warehouseId?: string,
    public readonly status?: CountStatus,
    public readonly page: number = 1,
    public readonly limit: number = 20) {}
}

@QueryHandler(GetCountsQuery)
@Injectable()
export class GetCountsHandler implements IQueryHandler<GetCountsQuery> {
  private readonly logger = new Logger(GetCountsHandler.name);

  constructor(@Inject(POS_V2_REPO) private readonly repo: IPosV2Repo) {}

  async execute(
    query: GetCountsQuery,
  ): Promise<Result<{ data: InventoryCount[]; total: number; page: number; limit: number }>> {
    try {
      const result = await this.repo.findCounts({
        warehouseId: query.warehouseId,
        status: query.status,
        page: query.page,
        limit: query.limit,
      });

      if (isErr(result)) {
        this.logger.error('Failed to get counts', result.error);
        return err(result.error);
      }

      return ok(result.data);
    } catch (error: unknown) {
      this.logger.error('Failed to get counts:', error);
      return err({
        message: 'Failed to get counts',
        code: 'GET_COUNTS_ERROR',
      });
    }
  }
}
