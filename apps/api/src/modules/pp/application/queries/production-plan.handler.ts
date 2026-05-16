/**
 * @module production-plan.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IPpRepository, PP_REPO } from '../../domain/repositories/pp.repository';

export class ProductionPlanQuery {
  constructor(public startDate: Date, public endDate: Date) {}
}

@QueryHandler(ProductionPlanQuery)
export class ProductionPlanHandler implements IQueryHandler<ProductionPlanQuery> {
  private readonly logger = new Logger(ProductionPlanHandler.name);
  constructor(
    @Inject(PP_REPO) private ppRepo: IPpRepository
  ) {}

  async execute(query: ProductionPlanQuery): Promise<Result<object[]>> {
    this.logger.log(
      { startDate: query.startDate, endDate: query.endDate },
      'Getting production plan',
    );

    return this.ppRepo.getProductionPlan(query.startDate, query.endDate);
  }
}
