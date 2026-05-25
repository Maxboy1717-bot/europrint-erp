/**
 * @module get-task.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { AppErr, Err } from '@common/result';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { GetTaskQuery } from './get-task.query';
import { KanbanTask } from '../../domain/aggregates/kanban-task.aggregate';
import { IKanbanRepo, KANBAN_REPO } from '../../domain/repositories/i-kanban.repo';

@Injectable()
@QueryHandler(GetTaskQuery)
export class GetTaskHandler implements IQueryHandler<GetTaskQuery> {
  private readonly logger = new Logger(GetTaskHandler.name);

  constructor(
    @Inject(KANBAN_REPO) private readonly kanbanRepo: IKanbanRepo,
      ) {}

  async execute(query: GetTaskQuery): Promise<Result<KanbanTask>> {
    const result = await this.kanbanRepo.findById(query.id);

    if (!result.ok) {
      this.logger.error('Failed to fetch kanban task');
      return result as Result<KanbanTask>;
    }

    if (!result.data) {
      this.logger.warn('Kanban task not found');
      return Err(AppErr('NOT_FOUND', 'Kanban task not found'));
    }

    this.logger.log('Kanban task fetched');

    return result as Result<KanbanTask>;
  }
}
