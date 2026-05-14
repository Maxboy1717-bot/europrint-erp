/**
 * @module director.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
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
import { DashboardQueryRepository } from './application/dashboard-query.repository';
import { DirectorDataService } from './application/director-data.service';
import { DirectorDataRepository } from './application/director-data.repository';
import { DirectorStateService } from './application/director-state.service';
import { DirectorStateRepository } from './application/director-state.repository';
import { OkrController } from './presentation/okr.controller';
import { KaizenController } from './presentation/kaizen.controller';
import { StrategicController } from './presentation/strategic.controller';
import { CoordinationController } from './presentation/coordination.controller';
import { ZvsController } from './presentation/zvs.controller';
import { ZnoController } from './presentation/zno.controller';
import { CoordinationService } from './application/coordination.service';
import { CoordinationRepository } from './application/coordination.repository';
import { KaizenService } from './application/kaizen.service';
import { OkrService } from './application/okr.service';
import { OkrRepository } from './application/okr.repository';
import { StrategicService } from './application/strategic.service';
import { StrategicRepository } from './application/strategic.repository';
import { ZnoService } from './application/zno.service';
import { ZnoRepository } from './application/zno.repository';
import { ZvsService } from './application/zvs.service';
import { ZvsRepository } from './application/zvs.repository';
import { KaizenRepository } from './application/kaizen.repository';

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
  imports: [CqrsModule, AuthModule],
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
  ],
  providers: [
    ...CommandHandlers, ...QueryHandlers, ...Repositories,
    DashboardQueryRepository, DashboardQueryService, DashboardService, DirectorDataService, DirectorDataRepository, DirectorStateService, DirectorStateRepository,
    CoordinationRepository, CoordinationService, KaizenRepository, KaizenService, OkrRepository, OkrService, StrategicRepository, StrategicService, ZnoRepository, ZnoService, ZvsRepository, ZvsService,
  ],
  exports: [APPROVAL_REPO, DASHBOARD_SVC_REPO, DashboardService],
})
export class DirectorModule {}
