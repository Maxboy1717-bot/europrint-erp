/**
 * @module kanban.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { I18nService } from 'nestjs-i18n';
import { CreateTaskCommand } from './commands/create-task.command';
import { UpdateTaskCommand } from './commands/update-task.command';
import { DeleteTaskCommand } from './commands/delete-task.command';
import { GetTasksQuery } from './queries/get-tasks.query';
import { GetTaskQuery } from './queries/get-task.query';
import { TaskStatus, TaskPriority } from '../domain/enums/task-status.enum';
import { CreateTaskDto, UpdateTaskDto } from '../presentation/dto/kanban.dto';
import { safeCall, Result, AppError } from '@common/result';
import { KANBAN_BATCH_FETCH } from '@common/constants/app.constants';

export interface WipLimitConfig {
  [status: string]: number;
}

const DEFAULT_WIP_LIMITS: WipLimitConfig = {
  [TaskStatus.IN_PROGRESS]: 10,
  [TaskStatus.REVIEW]: 5,
};

@Injectable()
export class KanbanService {
  private readonly logger = new Logger(KanbanService.name);
  private wipLimits: WipLimitConfig = { ...DEFAULT_WIP_LIMITS };

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventEmitter: EventEmitter2,
    private readonly i18n: I18nService,
  ) {}

  async getTasks(filters: { status?: string; assignedTo?: string; page?: number; limit?: number }): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    return this.queryBus.execute(new GetTasksQuery(filters));
  
    });}

  async getTask(id: string){
    return safeCall(async () => {
    return this.queryBus.execute(new GetTaskQuery(id));
  
    });}

  async createTask(dto: CreateTaskDto, userId: string | number){
    return safeCall(async () => {
    const task = await this.commandBus.execute(
      new CreateTaskCommand(
        dto.title,
        dto.description || '',
        'default-board',
        Number(userId),
        dto.priority as TaskPriority,
      ),
    );

    if (task?.ok) {
      await this.eventEmitter.emit('kanban.task.created', {
        taskId: task.data,
        title: dto.title,
        createdBy: userId,
      });
      this.logger.log(`Kanban task created by user ${userId}`);
    }

    return task;
  
    });}

  async updateTask(id: string, dto: UpdateTaskDto, userId: string | number){
    return safeCall(async () => {
    if (dto.status) {
      await this.checkWipLimit(dto.status as TaskStatus, id);
    }

    const result = await this.commandBus.execute(
      new UpdateTaskCommand(
        id,
        dto.status,
        dto.title,
        dto.description,
        dto.assignedTo,
        dto.priority,
        dto.dueDate,
        String(userId),
      ),
    );

    if (result?.ok && dto.status) {
      await this.eventEmitter.emit('kanban.task.moved', {
        taskId: id,
        newStatus: dto.status,
        movedBy: userId,
      });

      if (dto.assignedTo) {
        await this.eventEmitter.emit('kanban.task.assigned', {
          taskId: id,
          assigneeId: dto.assignedTo,
          assignedBy: userId,
          taskTitle: dto.title,
        });
        await this.eventEmitter.emit('notifications.create', {
          userId: String(dto.assignedTo),
          type: 'TASK_ASSIGNED',
          title: 'Yangi vazifa tayinlandi',
          body: dto.title ? `"${dto.title}" vazifasi sizga tayinlandi` : 'Yangi vazifa tayinlandi',
        });
      }
    }

    return result;
  
    });}

  async deleteTask(id: string, userId: string | number){
    return safeCall(async () => {
    const result = await this.commandBus.execute(new DeleteTaskCommand(id, String(userId)));

    if (result?.ok) {
      await this.eventEmitter.emit('kanban.task.deleted', { taskId: id, deletedBy: userId });
    }

    return result;
  
    });}

  getWipLimits(): WipLimitConfig {
    return { ...this.wipLimits };
  }

  async setWipLimit(status: TaskStatus, maxItems: number): Promise<void> {
    if (maxItems < 1) throw new BadRequestException(await this.i18n.t('errors.wipLimitMin'));
    this.wipLimits[status] = maxItems;
    this.logger.log(`WIP limit yangilandi: ${status} → max ${maxItems}`);
  }

  private async checkWipLimit(newStatus: TaskStatus, currentTaskId?: string): Promise<void> {
    const limit = this.wipLimits[newStatus];
    if (!limit) return;

    const result = await this.queryBus.execute(new GetTasksQuery({ status: newStatus, limit: KANBAN_BATCH_FETCH }));
    if (!result?.ok) return;

    const tasks = result.data?.items ?? result.data ?? [];
    const currentCount = Array.isArray(tasks) ? tasks.filter((t: Record<string, unknown>) => t.id !== currentTaskId).length : 0;

    if (currentCount >= limit) {
      throw new BadRequestException(
        `WIP limit oshib ketdi: "${newStatus}" kolonnasida max ${limit} ta vazifa bo'lishi mumkin (hozir: ${currentCount})`,
      );
    }
  }
}
