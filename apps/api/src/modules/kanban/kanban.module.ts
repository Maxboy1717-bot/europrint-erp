/**
 * @module kanban.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { KanbanBoardsService } from './application/kanban-boards.service';
import { KanbanExtService } from './application/kanban-ext.service';
import { KanbanExtFlowService } from './application/kanban-ext-flow.service';
import { KanbanExtCardService } from './application/kanban-ext-card.service';
import { KanbanRobotService } from './application/kanban-robot.service';
import { OrderCreatedKanbanHandler } from './application/event-handlers/order-created-kanban.handler';
import { OrderCancelledKanbanHandler } from './application/event-handlers/order-cancelled-kanban.handler';
import { OrderStatusChangedKanbanHandler } from './application/event-handlers/order-status-changed-kanban.handler';
import { QcFailedKanbanHandler } from './application/event-handlers/qc-failed-kanban.handler';
import { MesCompletedKanbanHandler } from './application/event-handlers/mes-completed-kanban.handler';
import { DesignRequestedKanbanHandler } from './application/event-handlers/design-requested-kanban.handler';
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
// 2026-07-13 — Kanban davriy vazifalar BullMQ'ga ko'chirildi (durability/offline-resistance,
// owner qarori): @nestjs/schedule @Cron o'rniga Redis-backed repeatable job. Ilgari shu joyda
// KanbanOverdueEscalationCron (@Cron) edi — endi KanbanCronProcessor (BullMQ) bitta navbatda
// OVERDUE_ESCALATION (avval shu yerda) + RECURRING_CARDS (avval apps/api/src/cron/kanban-recurring.cron.ts)
// ikkalasini ham bajaradi.
import { KanbanCronProcessor } from './infrastructure/cron/kanban-cron.processor';
import { QUEUE_NAMES } from '../queue/queue.constants';

const eventHandlers   = [
  OrderCreatedKanbanHandler,
  OrderCancelledKanbanHandler,
  OrderStatusChangedKanbanHandler,
  // QC/MES/Design Kanban fan-out (owner decision 2026-07-13): every source module that
  // already emits a real domain event gets a matching Kanban-card trigger, mirroring the
  // 3 SD order handlers above. waste-tracking (apps/api/src/modules/remaining/waste.*)
  // was evaluated too but has no domain-event emission at all (plain CRUD service) — not
  // fabricated here per Q-40.
  QcFailedKanbanHandler,
  MesCompletedKanbanHandler,
  DesignRequestedKanbanHandler,
];

const repositories = [
  { provide: KANBAN_BOARDS_REPO, useClass: KanbanBoardsRepository   },
];

/**
 * kanban-cron BullMQ navbat uchun standart job parametrlari — queue.module.ts'dagi
 * umumiy defaultJobOptions bilan bir xil shakl (attempts=10, exponential backoff
 * t0=1000ms, removeOnComplete/Fail). Mahalliy nusxa: bu navbat markaziy queue.module.ts
 * ro'yxatida emas, shu yerda (kanban.module.ts) registerQueue qilinadi.
 */
const kanbanCronJobOptions = {
  attempts: 10,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
  backoff: { type: 'exponential' as const, delay: 1000 },
};

@Module({
  imports:     [
    CqrsModule,
    AuthModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.KANBAN_CRON, defaultJobOptions: kanbanCronJobOptions }),
  ],
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
    // 2026-07-13 — Kanban davriy vazifalar (eskalatsiya 09:00 + takrorlanuvchi kartalar 07:00)
    // BullMQ repeatable job orqali; qarang infrastructure/cron/kanban-cron.processor.ts
    KanbanCronProcessor,
  ],
  exports: [KanbanExtService],
})
export class KanbanModule {}
