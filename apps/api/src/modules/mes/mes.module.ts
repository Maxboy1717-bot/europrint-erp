/**
 * @module mes.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MesSessionsController } from './presentation/mes-sessions.controller';
import { MesOperationsController } from './presentation/mes-operations.controller';
import { MesMaintenanceController }  from './presentation/mes-maintenance.controller';
import { MesShiftsStatsController }  from './presentation/mes-shifts-stats.controller';
import { MesProductionSessionsController } from './presentation/mes-production-sessions.controller';
import { StartSessionHandler } from './application/commands/start-session.handler';
import { CompleteSessionHandler } from './application/commands/complete-session.handler';
import { RecordDowntimeHandler } from './application/commands/record-downtime.handler';
import { EndDowntimeHandler } from './application/commands/end-downtime.handler';
import { GetSessionsHandler } from './application/queries/get-sessions.handler';
import { GetOeeHandler } from './application/queries/get-oee.handler';
import { GetDowntimeHandler } from './application/queries/get-downtime.handler';
import { GetDowntimeSummaryHandler } from './application/queries/get-downtime-summary.handler';
import { DrizzleMesRepository } from './infrastructure/repositories/drizzle-mes.repo';
import { DrizzleDowntimeRepository } from './infrastructure/repositories/drizzle-downtime.repo';
import { MES_REPO, DOWNTIME_REPO } from './domain/repositories/mes.repository';
import { WorkOrdersService } from './work-orders/work-orders.service';
import { MesMaintenanceService } from './application/mes-maintenance.service';
import { MesShiftsStatsService } from './application/mes-shifts-stats.service';
import { MesProductionSessionsService } from './application/mes-production-sessions.service';
import { DrizzleWorkOrdersRepository } from './work-orders/drizzle-work-orders.repo';
import { WORK_ORDERS_REPO } from './work-orders/i-work-orders.repo';
import { MesMaintenanceRepository } from './infrastructure/repositories/mes-maintenance.repo';
import { MesShiftsStatsRepository } from './infrastructure/repositories/mes-shifts-stats.repo';
import { MesProductionSessionsRepository } from './infrastructure/repositories/mes-production-sessions.repo';
import { MesSosEscalationRepository } from './infrastructure/repositories/mes-sos-escalation.repo';
import { MesSosEscalationService } from './application/mes-sos-escalation.service';
// Wave 4 round-2 (PA2-18): LmsCertExpiredListener split into two
// canonical @EventsHandler listeners + a shared block service.
import { LmsCertExpiredMesListener } from './infrastructure/event-handlers/lms-cert-expired-mes.listener';
import { LmsCertExpiredLiveMesListener } from './infrastructure/event-handlers/lms-cert-expired-live-mes.listener';
import { LmsCertExpiredBlockService } from './infrastructure/event-handlers/lms-cert-expired-block.service';
import { PpReleasedMesListener } from './infrastructure/event-handlers/pp-released-mes.listener';

const listeners = [
  LmsCertExpiredMesListener,       // Trigger 17 — daily-sweep variant (Wave 4 round-2)
  LmsCertExpiredLiveMesListener,   // Trigger 17 — realtime variant   (Wave 4 round-2)
  PpReleasedMesListener,           // #03 HOP-2 — PP released → open MES production session
];

const handlers = [
  StartSessionHandler,
  CompleteSessionHandler,
  RecordDowntimeHandler,
  EndDowntimeHandler,
  GetSessionsHandler,
  GetOeeHandler,
  GetDowntimeHandler,
  GetDowntimeSummaryHandler,
];

@Module({
  imports: [CqrsModule, EventEmitterModule.forRoot()],
  controllers: [MesSessionsController, MesOperationsController, MesMaintenanceController, MesShiftsStatsController, MesProductionSessionsController],
  providers: [
    ...handlers,
    ...listeners,
    LmsCertExpiredBlockService,    // Wave 4 round-2: shared by Trigger 17 split listeners
    { provide: MES_REPO, useClass: DrizzleMesRepository },
    { provide: DOWNTIME_REPO, useClass: DrizzleDowntimeRepository },
    { provide: WORK_ORDERS_REPO, useClass: DrizzleWorkOrdersRepository },
    WorkOrdersService,
    MesMaintenanceService,
    MesShiftsStatsService,
    MesProductionSessionsService,
    MesMaintenanceRepository,
    MesShiftsStatsRepository,
    MesProductionSessionsRepository,
    // #11 — SOS/downtime org-zanjir eskalatsiya
    MesSosEscalationRepository,
    MesSosEscalationService,
  ],
  exports: [MES_REPO, DOWNTIME_REPO, WORK_ORDERS_REPO, WorkOrdersService, MesSosEscalationService],
})
export class MesModule {}
