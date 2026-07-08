/**
 * @module kanban.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { KanbanBoardsService } from './application/kanban-boards.service';
import { KanbanExtService } from './application/kanban-ext.service';
import { KanbanExtFlowService } from './application/kanban-ext-flow.service';
import { KanbanExtCardService } from './application/kanban-ext-card.service';
import { KanbanRobotService } from './application/kanban-robot.service';
import { OrderCreatedKanbanHandler } from './application/event-handlers/order-created-kanban.handler';
import { OrderCancelledKanbanHandler } from './application/event-handlers/order-cancelled-kanban.handler';
import { OrderStatusChangedKanbanHandler } from './application/event-handlers/order-status-changed-kanban.handler';
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
import { KanbanBoardsController } from './presentation/kanban-boards.controller';
import { KanbanCoreController } from './presentation/kanban-core.controller';
import { KanbanReportsController } from './presentation/kanban-reports.controller';
import { KanbanCardsController, KanbanCardFilesController } from './presentation/kanban-cards.controller';
import { KanbanChecklistController } from './presentation/kanban-checklist.controller';
import { KANBAN_BOARDS_REPO } from './domain/repositories/i-kanban-boards.repo';
import { KanbanRepository } from './infrastructure/kanban.repository';
// 06-30 to'lqin: muddati o'tgan vazifa eskalatsiya cron
import { KanbanOverdueEscalationCron } from './infrastructure/cron/kanban-overdue-escalation.cron';

const eventHandlers   = [OrderCreatedKanbanHandler, OrderCancelledKanbanHandler, OrderStatusChangedKanbanHandler];

const repositories = [
  { provide: KANBAN_BOARDS_REPO, useClass: KanbanBoardsRepository   },
];

@Module({
  imports:     [CqrsModule, AuthModule],
  controllers: [
    KanbanBoardsController,
    KanbanCoreController,
    KanbanReportsController,
    KanbanCardsController,
    KanbanCardFilesController,
    KanbanChecklistController,
  ],
  providers: [
    ...eventHandlers,
    ...repositories,
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
    // 06-30 to'lqin: muddati o'tgan vazifa eskalatsiya cron
    KanbanOverdueEscalationCron,
  ],
  exports: [KanbanExtService],
})
export class KanbanModule {}
