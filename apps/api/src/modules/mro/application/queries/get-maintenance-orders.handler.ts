import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result, PaginatedResult , Ok } from '@common/types/result.type';
import { GetMaintenanceOrdersQuery } from './get-maintenance-orders.query';
import { MaintenanceOrder } from '../../domain/aggregates/maintenance-order.aggregate';
import { IMaintenanceRepo, MAINTENANCE_REPO } from '../../domain/repositories/i-maintenance.repo';

@Injectable()
@QueryHandler(GetMaintenanceOrdersQuery)
export class GetMaintenanceOrdersHandler implements IQueryHandler<GetMaintenanceOrdersQuery> {
  private readonly logger = new Logger(GetMaintenanceOrdersHandler.name);

  constructor(
    @Inject(MAINTENANCE_REPO) private readonly maintenanceRepo: IMaintenanceRepo,
      ) {}

  async execute(query: GetMaintenanceOrdersQuery): Promise<Result<PaginatedResult<MaintenanceOrder>>> {
    const result = await this.maintenanceRepo.findAll(query.filters);

    if (!result.ok) {
      this.logger.error('Failed to fetch maintenance orders');
      return result;
    }

    const page = query.filters.page || 1;
    const limit = query.filters.limit || 10;

    const paginatedResult: PaginatedResult<MaintenanceOrder> = {
      items: result.data.items,
      total: result.data.total,
      page,
      limit,
    };

    this.logger.log('Maintenance orders fetched');

    return Ok(paginatedResult);
  }
}
