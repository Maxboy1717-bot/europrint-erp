import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok } from '@common/result';
import { CreateTaskCommand } from './create-task.command';
import { TaskCreatedEvent } from '../../domain/events';
import { KanbanTask } from '../../domain/aggregates/kanban-task.aggregate';
import { TaskPriority } from '../../domain/enums/task-status.enum';

@Injectable()
@CommandHandler(CreateTaskCommand)
export class CreateTaskHandler implements ICommandHandler<CreateTaskCommand> {
  private readonly logger = new Logger(CreateTaskHandler.name);

  constructor(
    private readonly eventBus: EventBus,
      ) {}

  async execute(command: CreateTaskCommand): Promise<Result<string>> {
      const task = KanbanTask.create(
        command.title,
        command.description,
        command.boardId,
        command.createdBy,
        (command.priority as TaskPriority) || TaskPriority.MEDIUM,
      );

      this.eventBus.publish(new TaskCreatedEvent(task.id, task.boardId, task.title));
      this.logger.log('Task created');
      return Ok(task.id);
  }
}
