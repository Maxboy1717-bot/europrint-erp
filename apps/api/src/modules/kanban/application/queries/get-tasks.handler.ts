import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result, PaginatedResult , Ok } from '@common/types/result.type';
import { GetTasksQuery } from './get-tasks.query';
import { KanbanTask } from '../../domain/aggregates/kanban-task.aggregate';
import { IKanbanRepo, KANBAN_REPO } from '../../domain/repositories/i-kanban.repo';

@Injectable()
@QueryHandler(GetTasksQuery)
export class GetTasksHandler implements IQueryHandler<GetTasksQuery> {
  private readonly logger = new Logger(GetTasksHandler.name);

  constructor(
    @Inject(KANBAN_REPO) private readonly kanbanRepo: IKanbanRepo,
      ) {}

  async execute(query: GetTasksQuery): Promise<Result<PaginatedResult<KanbanTask>>> {
    const result = await this.kanbanRepo.findAll(query.filters);

    if (!result.ok) {
      this.logger.error('Failed to fetch kanban tasks');
      return result;
    }

    const page = query.filters.page || 1;
    const limit = query.filters.limit || 10;

    const paginatedResult: PaginatedResult<KanbanTask> = {
      items: result.data.items,
      total: result.data.total,
      page,
      limit,
    };

    this.logger.log('Kanban tasks fetched');

    return Ok(paginatedResult);
  }
}
