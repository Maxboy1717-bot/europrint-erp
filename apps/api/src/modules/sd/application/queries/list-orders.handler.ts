import { AppErr, Err, Ok, Result } from '@common/result';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ISalesOrderRepository } from '../../domain/repositories/i-sales-order.repo';
import { SalesOrder } from '../../domain/aggregates/sales-order.aggregate';

interface PaginatedOrders {
  data: SalesOrder[];
  pagination: { limit: number; offset: number; total: number };
}

export class ListOrdersQuery {
  constructor(
    public readonly companyId?: number,
    public readonly status?: string,
    public readonly limit: number = 20,
    public readonly offset: number = 0,
  ) {}
}

@QueryHandler(ListOrdersQuery)
export class ListOrdersHandler implements IQueryHandler<ListOrdersQuery> {
  private readonly logger = new Logger(ListOrdersHandler.name);

  constructor(
    @Inject('ISalesOrderRepository') private readonly orderRepo: ISalesOrderRepository,
  ) {}

  async execute(query: ListOrdersQuery): Promise<Result<PaginatedOrders>> {
    this.logger.debug(`Listing orders status=${query.status} companyId=${query.companyId}`);

    let result: Awaited<ReturnType<typeof this.orderRepo.findByStatus>>;
    if (query.status) {
      result = await this.orderRepo.findByStatus(query.status, query.limit, query.offset);
    } else if (query.companyId) {
      result = await this.orderRepo.findByCompanyId(query.companyId, query.limit, query.offset);
    } else {
      const pendingResult = await this.orderRepo.findPendingAdvanceOrders(query.limit, query.offset);
      result = pendingResult.ok ? pendingResult : { ok: true as const, data: [] };
    }

    if (!result.ok) {
      this.logger.error(`Failed to fetch orders: ${result.error}`);
      return Err(AppErr('INTERNAL', 'Failed to fetch orders'));
    }

    const countResult = await this.orderRepo.count();
    const total = countResult.ok ? (countResult.data ?? 0) : 0;

    return Ok({
      data: result.data ?? [],
      pagination: { limit: query.limit, offset: query.offset, total },
    });
  }
}
