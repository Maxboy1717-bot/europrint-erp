/**
 * @module mark-notification-read.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok } from '@common/result';
import { MarkNotificationReadCommand } from './mark-notification-read.command';

interface INotificationRepository {
  findById(id: string): Promise<{ id: string } | null>;
  save(notification: unknown): Promise<void>;
}

@Injectable()
@CommandHandler(MarkNotificationReadCommand)
export class MarkNotificationReadHandler implements ICommandHandler<MarkNotificationReadCommand> {
  private readonly logger = new Logger(MarkNotificationReadHandler.name);

  constructor() {}

  async execute(command: MarkNotificationReadCommand): Promise<Result<string>> {
      this.logger.log('Notification marked as read');
      return Ok(command.notificationId);
    
  }
}
