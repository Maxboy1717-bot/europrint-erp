/**
 * @module create-task.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result, Ok, Err } from '@common/result';
import { CreateTaskCommand } from './create-task.command';
import { TaskCreatedEvent } from '../../domain/events';
import { KanbanTask } from '../../domain/aggregates/kanban-task.aggregate';
import { TaskPriority } from '../../domain/enums/task-status.enum';
import { IKanbanRepo, KANBAN_REPO } from '../../domain/repositories/i-kanban.repo';

@Injectable()
@CommandHandler(CreateTaskCommand)
export class CreateTaskHandler implements ICommandHandler<CreateTaskCommand> {
  private readonly logger = new Logger(CreateTaskHandler.name);

  constructor(
    private readonly eventBus: EventBus,
    @Inject(KANBAN_REPO) private readonly repo: IKanbanRepo,
  ) {}

  async execute(command: CreateTaskCommand): Promise<Result<string>> {
      const task = KanbanTask.create(
        command.title,
        command.description,
        command.boardId,
        command.createdBy,
        (command.priority as TaskPriority) || TaskPriority.MEDIUM,
      );

      const saveResult = await this.repo.save(task);
      if (!saveResult || saveResult.ok === false) {
        return Err('Task saqlashda xato');
      }

      this.eventBus.publish(new TaskCreatedEvent(task.id, task.boardId, task.title));
      this.logger.log('Task created');
      return Ok(task.id);
  }
}
