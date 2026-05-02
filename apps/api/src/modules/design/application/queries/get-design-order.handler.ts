import { AppErr, Err, Ok, Result } from '@common/result';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { GetDesignOrderQuery } from './get-design-order.query';
import { DesignOrder } from '../../domain/aggregates/design-order.aggregate';
import { IDesignRepo, DESIGN_REPO } from '../../domain/repositories/i-design.repo';

@Injectable()
@QueryHandler(GetDesignOrderQuery)
export class GetDesignOrderHandler implements IQueryHandler<GetDesignOrderQuery> {
  private readonly logger = new Logger(GetDesignOrderHandler.name);

  constructor(
    @Inject(DESIGN_REPO) private readonly designRepo: IDesignRepo,
      ) {}

  async execute(query: GetDesignOrderQuery): Promise<Result<DesignOrder>> {
    const result = await this.designRepo.findById(query.id);

    if (!result.ok) {
      this.logger.error('Failed to fetch design order');
      return Err(result.error ?? 'Failed to fetch design order');
    }

    if (!result.data) {
      this.logger.warn('Design order not found');
      return Err(AppErr('NOT_FOUND', 'Design order not found'));
    }

    this.logger.log('Design order fetched');

    return Ok(result.data);
  }
}
