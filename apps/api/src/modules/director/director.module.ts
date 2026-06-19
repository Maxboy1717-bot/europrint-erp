/**
 * @module director.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from '../auth/auth.module';

import { APPROVAL_REPO } from './domain/repositories/i-approval.repo';
import { DrizzleApprovalRepo } from './infrastructure/repositories/drizzle-approval.repo';
import { DrizzleApprovalWriteRepo } from './infrastructure/repositories/drizzle-approval-write.repo';
import { DashboardService } from './dashboard/dashboard.service';
import { DrizzleDashboardSvcRepository } from './dashboard/drizzle-dashboard-svc.repo';
import { DASHBOARD_SVC_REPO } from './dashboard/i-dashboard-svc.repo';

import { CreateApprovalRequestHandler } from './application/commands/create-approval-request.handler';
import { ApproveRequestHandler } from './application/commands/approve-request.handler';
import { RejectRequestHandler } from './application/commands/reject-request.handler';

import { GetPendingApprovalsHandler } from './application/queries/get-pending-approvals.handler';
import { GetApprovalHistoryHandler } from './application/queries/get-approval-history.handler';
import { GetDashboardKpisHandler } from './application/queries/get-dashboard-kpis.handler';

import { ApprovalsController } from './presentation/approvals.controller';
import { DashboardController } from './presentation/dashboard.controller';
import { DirectorRootController } from './presentation/director-root.controller';
import { DirectorExtendedController } from './presentation/director-extended.controller';
import { DashboardQueryService } from './application/dashboard-query.service';
import { DashboardQueryRepository } from './infrastructure/repositories/dashboard-query.repository';
import { DirectorDataService } from './application/director-data.service';
import { DirectorDataRepository } from './infrastructure/repositories/director-data.repository';
import { DirectorStateService } from './application/director-state.service';
import { DirectorStateRepository } from './infrastructure/repositories/director-state.repository';
import { OkrController } from './presentation/okr.controller';
import { KaizenController } from './presentation/kaizen.controller';
import { StrategicController } from './presentation/strategic.controller';
import { CoordinationController } from './presentation/coordination.controller';
import { ZvsController } from './presentation/zvs.controller';
import { ZnoController } from './presentation/zno.controller';
import { CoordinationService } from './application/coordination.service';
import { CoordinationRepository } from './infrastructure/repositories/coordination.repository';
import { KaizenService } from './application/kaizen.service';
import { OkrService } from './application/okr.service';
import { OkrRepository } from './infrastructure/repositories/okr.repository';
import { StrategicService } from './application/strategic.service';
import { StrategicRepository } from './infrastructure/repositories/strategic.repository';
import { ZnoService } from './application/zno.service';
import { ZnoRepository } from './infrastructure/repositories/zno.repository';
import { ZvsService } from './application/zvs.service';
import { ZvsRepository } from './infrastructure/repositories/zvs.repository';
import { KaizenRepository } from './infrastructure/repositories/kaizen.repository';
import { DirectorHolatService } from './application/director-holat.service';
import { AdvanceBypassApprovedListener } from './infrastructure/event-handlers/advance-bypass-approved.listener';
// PA3-17 Wave 6: merged from former modules/analytics/ (route prefix '/analytics' preserved)
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsExtendedController } from './analytics/analytics-extended.controller';
import { AnalyticsService } from './analytics/analytics.service';
import { AnalyticsExtendedService } from './analytics/analytics-extended.service';
import { AnalyticsRepository } from './analytics/analytics.repository';
import { AnalyticsExtendedRepository } from './analytics/analytics-extended.repository';
import { COORDINATION_REPO } from './domain/repositories/i-coordination.repo';
import { DASHBOARD_QUERY_REPO } from './domain/repositories/i-dashboard-query.repo';
// P30 Wave 3: stat-regulation + diary + monthly-plan
import { StatRegulationController } from './presentation/stat-regulation.controller';
import { StatRegulationService } from './application/stat-regulation.service';
import { StatRegulationRepository } from './infrastructure/repositories/stat-regulation.repository';
import { STAT_REGULATION_REPO } from './domain/repositories/i-stat-regulation.repo';
import { DiaryController } from './presentation/diary.controller';
import { DiaryService } from './application/diary.service';
import { DiaryRepository } from './infrastructure/repositories/diary.repository';
import { DIARY_REPO } from './domain/repositories/i-diary.repo';
import { MonthlyPlanController } from './presentation/monthly-plan.controller';
import { MonthlyPlanService } from './application/monthly-plan.service';
import { MonthlyPlanRepository } from './infrastructure/repositories/monthly-plan.repository';
import { MONTHLY_PLAN_REPO } from './domain/repositories/i-monthly-plan.repo';
import { DIRECTOR_DATA_REPO } from './domain/repositories/i-director-data.repo';
import { DIRECTOR_STATE_REPO } from './domain/repositories/i-director-state.repo';
import { KAIZEN_REPO } from './domain/repositories/i-kaizen.repo';
import { OKR_REPO } from './domain/repositories/i-okr.repo';
import { STRATEGIC_REPO } from './domain/repositories/i-strategic.repo';
import { ZNO_REPO } from './domain/repositories/i-zno.repo';
import { ZVS_REPO } from './domain/repositories/i-zvs.repo';

const CommandHandlers = [
  CreateApprovalRequestHandler,
  ApproveRequestHandler,
  RejectRequestHandler,
];

const QueryHandlers = [
  GetPendingApprovalsHandler,
  GetApprovalHistoryHandler,
  GetDashboardKpisHandler,
];

const Repositories = [
  DrizzleApprovalWriteRepo,
  {
    provide: APPROVAL_REPO,
    useClass: DrizzleApprovalRepo,
  },
  { provide: DASHBOARD_SVC_REPO, useClass: DrizzleDashboardSvcRepository },
];

@Module({
  imports: [CqrsModule, EventEmitterModule.forRoot(), AuthModule],
  controllers: [
    ApprovalsController,
    DashboardController,
    DirectorRootController,
    DirectorExtendedController,
    OkrController,
    KaizenController,
    StrategicController,
    CoordinationController,
    ZvsController,
    ZnoController,
    // PA3-17 Wave 6: merged from modules/analytics/
    AnalyticsController,
    AnalyticsExtendedController,
    // P30 Wave 3
    StatRegulationController,
    DiaryController,
    MonthlyPlanController,
  ],
  providers: [
    ...CommandHandlers, ...QueryHandlers, ...Repositories,
    DashboardQueryRepository,
    { provide: DASHBOARD_QUERY_REPO, useClass: DashboardQueryRepository },
    DashboardQueryService, DashboardService, DirectorDataService, DirectorDataRepository,
    { provide: DIRECTOR_DATA_REPO, useClass: DirectorDataRepository },
    DirectorStateService, DirectorStateRepository,
    { provide: DIRECTOR_STATE_REPO, useClass: DirectorStateRepository },
    CoordinationRepository,
    { provide: COORDINATION_REPO, useClass: CoordinationRepository },
    CoordinationService,
    KaizenRepository,
    { provide: KAIZEN_REPO, useClass: KaizenRepository },
    KaizenService,
    OkrRepository,
    { provide: OKR_REPO, useClass: OkrRepository },
    OkrService,
    StrategicRepository,
    { provide: STRATEGIC_REPO, useClass: StrategicRepository },
    StrategicService,
    ZnoRepository,
    { provide: ZNO_REPO, useClass: ZnoRepository },
    ZnoService,
    ZvsRepository,
    { provide: ZVS_REPO, useClass: ZvsRepository },
    ZvsService,
    // EP-DIR-001/EP-DIR-029: pure holat formula service
    DirectorHolatService,
    // PA0 Trigger 20 — advance bypass audit listener
    AdvanceBypassApprovedListener,
    // PA3-17 Wave 6: merged from modules/analytics/
    AnalyticsService,
    AnalyticsExtendedService,
    AnalyticsRepository,
    AnalyticsExtendedRepository,
    // P30 Wave 3: stat-regulation + diary + monthly-plan
    StatRegulationRepository,
    { provide: STAT_REGULATION_REPO, useClass: StatRegulationRepository },
    StatRegulationService,
    DiaryRepository,
    { provide: DIARY_REPO, useClass: DiaryRepository },
    DiaryService,
    MonthlyPlanRepository,
    { provide: MONTHLY_PLAN_REPO, useClass: MonthlyPlanRepository },
    MonthlyPlanService,
  ],
  exports: [APPROVAL_REPO, DASHBOARD_SVC_REPO, DashboardService, DirectorHolatService],
})
export class DirectorModule {}
