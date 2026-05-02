import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { CreateTaskHandler } from './application/commands/create-task.handler';
import { UpdateTaskHandler } from './application/commands/update-task.handler';
import { DeleteTaskHandler } from './application/commands/delete-task.handler';
import { GetTasksHandler } from './application/queries/get-tasks.handler';
import { GetTaskHandler } from './application/queries/get-task.handler';
import { KanbanService } from './application/kanban.service';
import { KanbanBoardsService } from './application/kanban-boards.service';
import { KanbanExtService } from './application/kanban-ext.service';
import { DrizzleKanbanExtRepository } from './infrastructure/repositories/drizzle-kanban-ext.repo';
import { KanbanBoardsRepository } from './infrastructure/repositories/kanban-boards.repo';
import { KanbanController } from './presentation/kanban.controller';
import { KanbanBoardsController } from './presentation/kanban-boards.controller';
import { KanbanExtController } from './presentation/kanban-ext.controller';
import { KanbanChecklistController } from './presentation/kanban-checklist.controller';
import { KANBAN_REPO } from './domain/repositories/i-kanban.repo';
import { KANBAN_BOARDS_REPO } from './domain/repositories/i-kanban-boards.repo';
import { DrizzleKanbanRepository } from './infrastructure/repositories/drizzle-kanban.repo';

const commandHandlers = [CreateTaskHandler, UpdateTaskHandler, DeleteTaskHandler];
const queryHandlers = [GetTasksHandler, GetTaskHandler];
const repositories = [
  {
    provide: KANBAN_REPO,
    useClass: DrizzleKanbanRepository,
  },
  {
    provide: KANBAN_BOARDS_REPO,
    useClass: KanbanBoardsRepository,
  },
];

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [KanbanBoardsController, KanbanController, KanbanExtController, KanbanChecklistController],
  providers: [...commandHandlers, ...queryHandlers, ...repositories, KanbanService, KanbanBoardsService, KanbanExtService, DrizzleKanbanExtRepository],
  exports: [KANBAN_REPO, KanbanService],
})
export class KanbanModule {}
