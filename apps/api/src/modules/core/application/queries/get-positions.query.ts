/**
 * @module get-positions.query
 * @description Source module. See exports for details.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { ICoreRepo, CORE_REPO } from '../../domain/repositories/i-core.repo';
import { Position } from '../../domain/aggregates/position.aggregate';

export class GetPositionsQuery {
  constructor(public readonly filters?: { departmentId?: string; isActive?: boolean }) {}
}

@QueryHandler(GetPositionsQuery)
export class GetPositionsHandler implements IQueryHandler<GetPositionsQuery> {
  private readonly logger = new Logger(GetPositionsHandler.name);

  constructor(@Inject(CORE_REPO) private repo: ICoreRepo) {}

  async execute(query: GetPositionsQuery): Promise<Result<Position[]>> {
    const result = await this.repo.findAllPositions(query.filters);

    return result;
  }
}
