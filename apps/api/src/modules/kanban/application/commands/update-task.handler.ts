/**
 * @module update-task.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { AppErr, Err } from '@common/result';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { UpdateTaskCommand } from './update-task.command';
import { KanbanTask } from '../../domain/aggregates/kanban-task.aggregate';
import { IKanbanRepo, KANBAN_REPO } from '../../domain/repositories/i-kanban.repo';
import { isTransitionAllowed } from '@common/constants/status-machines.constants';

const KANBAN_TRANSITIONS: Record<string, string[]> = {
  todo: ['in_progress', 'blocked'],
  in_progress: ['review', 'todo', 'blocked'],
  review: ['done', 'in_progress'],
  done: [],
  blocked: ['todo', 'in_progress'],
};

@Injectable()
@CommandHandler(UpdateTaskCommand)
export class UpdateTaskHandler implements ICommandHandler<UpdateTaskCommand> {
  private readonly logger = new Logger(UpdateTaskHandler.name);

  constructor(
    @Inject(KANBAN_REPO) private readonly kanbanRepo: IKanbanRepo,
      ) {}

  async execute(command: UpdateTaskCommand): Promise<Result<KanbanTask>> {
    const existing = await this.kanbanRepo.findById(command.id);

    if (!existing.ok || !existing.data) {
      this.logger.error('Kanban task not found');
      return Err(AppErr('NOT_FOUND', 'Kanban task not found'));
    }

    const task = existing.data;

    if (command.status && !isTransitionAllowed(KANBAN_TRANSITIONS, task.status, command.status)) {
      this.logger.error(
        { from: task.status, to: command.status },
        'Invalid status transition for kanban task',
      );
      return Err(`Cannot transition from ${task.status} to ${command.status}`);
    }

    if (command.title) task.title = command.title;
    if (command.description) task.description = command.description;
    if (command.status) task.status = command.status as typeof task.status;
    if (command.priority) task.priority = command.priority as typeof task.priority;
    if (command.assignedTo) task.assigneeId = parseInt(command.assignedTo);
    if (command.dueDate) task.dueDate = command.dueDate;

    const result = await this.kanbanRepo.update(command.id, task);

    if (!result.ok) {
      this.logger.error('Failed to update kanban task');
      return result;
    }

    this.logger.log('Kanban task updated');

    return result;
  }
}
