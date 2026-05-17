/**
 * @module kanban.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

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
import { KanbanExtFlowService } from './application/kanban-ext-flow.service';
import { KanbanExtCardService } from './application/kanban-ext-card.service';
import { KanbanRobotService } from './application/kanban-robot.service';
import { OrderCreatedKanbanHandler } from './application/event-handlers/order-created-kanban.handler';
import { OrderCancelledKanbanHandler } from './application/event-handlers/order-cancelled-kanban.handler';
import { DrizzleKanbanExtRepository } from './infrastructure/repositories/drizzle-kanban-ext.repo';
import { DrizzleKanbanCoreRepository } from './infrastructure/repositories/drizzle-kanban-core.repo';
import { DrizzleKanbanFlowsRobotsRepository } from './infrastructure/repositories/drizzle-kanban-flows-robots.repo';
import { DrizzleKanbanCardsRepository } from './infrastructure/repositories/drizzle-kanban-cards.repo';
import { DrizzleKanbanEngagementRepository } from './infrastructure/repositories/drizzle-kanban-engagement.repo';
import { DrizzleKanbanAnalyticsRepository } from './infrastructure/repositories/drizzle-kanban-analytics.repo';
import { DrizzleKanbanResultsFilesRepository } from './infrastructure/repositories/drizzle-kanban-results-files.repo';
import { DrizzleKanbanStatsRepository } from './infrastructure/repositories/drizzle-kanban-stats.repo';
import { KanbanBoardsRepository } from './infrastructure/repositories/kanban-boards.repo';
import { KanbanColumnsRepository } from './infrastructure/repositories/kanban-columns.repo';
import { KanbanCardsRepository } from './infrastructure/repositories/kanban-cards.repo';
import { KanbanController } from './presentation/kanban.controller';
import { KanbanBoardsController } from './presentation/kanban-boards.controller';
import { KanbanCoreController } from './presentation/kanban-core.controller';
import { KanbanReportsController } from './presentation/kanban-reports.controller';
import { KanbanCardsController, KanbanCardFilesController } from './presentation/kanban-cards.controller';
import { KanbanChecklistController } from './presentation/kanban-checklist.controller';
import { KANBAN_REPO } from './domain/repositories/i-kanban.repo';
import { KANBAN_BOARDS_REPO } from './domain/repositories/i-kanban-boards.repo';
import { DrizzleKanbanRepository } from './infrastructure/repositories/drizzle-kanban.repo';
import { KanbanRepository } from './infrastructure/kanban.repository';

const commandHandlers = [CreateTaskHandler, UpdateTaskHandler, DeleteTaskHandler];
const queryHandlers   = [GetTasksHandler, GetTaskHandler];
const eventHandlers   = [OrderCreatedKanbanHandler, OrderCancelledKanbanHandler];

const repositories = [
  { provide: KANBAN_REPO,        useClass: DrizzleKanbanRepository  },
  { provide: KANBAN_BOARDS_REPO, useClass: KanbanBoardsRepository   },
];

@Module({
  imports:     [CqrsModule, AuthModule],
  controllers: [
    KanbanBoardsController,
    KanbanController,
    KanbanCoreController,
    KanbanReportsController,
    KanbanCardsController,
    KanbanCardFilesController,
    KanbanChecklistController,
  ],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
    ...repositories,
    KanbanService,
    KanbanBoardsService,
    KanbanExtService,
    KanbanExtFlowService,
    KanbanExtCardService,
    KanbanRobotService,
    KanbanRepository,
    DrizzleKanbanCoreRepository,
    DrizzleKanbanFlowsRobotsRepository,
    DrizzleKanbanCardsRepository,
    DrizzleKanbanEngagementRepository,
    DrizzleKanbanAnalyticsRepository,
    DrizzleKanbanResultsFilesRepository,
    DrizzleKanbanStatsRepository,
    DrizzleKanbanExtRepository,
    KanbanColumnsRepository,
    KanbanCardsRepository,
  ],
  exports: [KANBAN_REPO, KanbanService, KanbanExtService],
})
export class KanbanModule {}
