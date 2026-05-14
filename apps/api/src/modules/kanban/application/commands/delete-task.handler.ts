/**
 * @module delete-task.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { AppErr, Err } from '@common/result';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { DeleteTaskCommand } from './delete-task.command';
import { IKanbanRepo, KANBAN_REPO } from '../../domain/repositories/i-kanban.repo';

@Injectable()
@CommandHandler(DeleteTaskCommand)
export class DeleteTaskHandler implements ICommandHandler<DeleteTaskCommand> {
  private readonly logger = new Logger(DeleteTaskHandler.name);

  constructor(
    @Inject(KANBAN_REPO) private readonly kanbanRepo: IKanbanRepo,
      ) {}

  async execute(command: DeleteTaskCommand): Promise<Result<void>> {
    const existing = await this.kanbanRepo.findById(command.id);

    if (!existing.ok || !existing.data) {
      this.logger.error('Kanban task not found');
      return Err(AppErr('NOT_FOUND', 'Kanban task not found'));
    }

    const task = existing.data;

    if (task.createdBy.toString() !== command.userId) {
      this.logger.warn(
        { id: command.id, userId: command.userId },
        'User is not task creator',
      );
      return Err(AppErr('FORBIDDEN', 'Only task creator or admin can delete'));
    }

    const result = await this.kanbanRepo.delete(command.id);

    if (!result.ok) {
      this.logger.error('Failed to delete kanban task');
      return result;
    }

    this.logger.log('Kanban task deleted');

    return result;
  }
}
