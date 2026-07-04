/**
 * @module remaining.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CronModule } from '../../cron/cron.module';
// Q23 fix: SupplyChainController.refresh() endi haqiqiy MV refresh qiladi.
import { QueueModule } from '../queue/queue.module';

import { WasteController } from './waste.controller';
import { ExceptionLogController } from './exception-log.controller';
import { ReportsHubController } from './reports-hub.controller';
import { SystemController, SystemSettingsController, SupplyChainController } from './system.controller';
import { WeeklyPlanController } from './weekly-plan.controller';
import { MaterialBalanceController } from './material-balance.controller';
import { CompanyStateController } from './company-state.controller';
// fi.controller.ts/fi.service.ts/fi.repository.ts o'chirildi: FinanceModule.FiController
// (/api/fi) va FinanceAccountingController (/api/accounting) bilan duplikat GL yozuvchi edi —
// bu controller hech qaysi @Module()ga ro'yxatdan o'tmagan, /legacy/fi/gl-documents marshruti
// runtime'da mavjud emas edi (o'lik kod) va gl_documents jadvaliga GlPostingService/entries
// ledgeriga sinxronizatsiyasiz to'g'ridan-to'g'ri INSERT qilardi. Q-46.
import { IdealRasmController } from './ideal-rasm.controller';
import { ProductionFactsController } from './production-facts.controller';
import { OrderStatusController } from './order-status.controller';
import { ThreeWayMatchController } from './three-way-match.controller';

import { WasteService } from './waste.service';
import { ExceptionLogService } from './exception-log.service';
import { ReportsHubService } from './reports-hub.service';
import { SystemService } from './system.service';
import { SystemRepository } from './system.repository';
import { WeeklyPlanService } from './weekly-plan.service';
import { WeeklyPlanRepository } from './weekly-plan.repository';
import { MaterialBalanceService } from './material-balance.service';
import { MaterialBalanceRepository } from './material-balance.repository';
import { CompanyStateService } from './company-state.service';
import { CompanyStateRepository } from './company-state.repository';
import { CompanyStateSnapshotCron } from './company-state-snapshot.cron';
// EP-DIR-001: pure 5-metric holat formula service (stateless, no ctor deps) —
// provided directly so /api/company-state/current delegates to the vision-correct calc.
import { DirectorHolatService } from '../director/application/director-holat.service';
import { IdealRasmService } from './ideal-rasm.service';
import { IdealRasmRepository } from './ideal-rasm.repository';
import { ExceptionLogRepository } from './exception-log.repository';
import { ProductionFactsService } from './production-facts.service';
import { ProductionFactsRepository } from './production-facts.repository';
import { OrderStatusService } from './order-status.service';
import { OrderStatusRepository } from './order-status.repository';
import { ThreeWayMatchService }    from '../pos/application/services/three-way-match.service';
import { ThreeWayMatchRepository } from '../pos/infrastructure/repositories/three-way-match.repository';
import { WasteRepository } from './waste.repository';
import { ReportsHubRepository } from './reports-hub.repository';

@Module({
  imports: [CronModule, QueueModule],
  controllers: [
    WasteController,
    ExceptionLogController,
    ReportsHubController,
    SystemController,
    SystemSettingsController,
    SupplyChainController,
    WeeklyPlanController,
    MaterialBalanceController,
    CompanyStateController,
    IdealRasmController,
    ProductionFactsController,
    OrderStatusController,
    ThreeWayMatchController,
  ],
  providers: [
    WasteRepository,
    ReportsHubRepository,
    WasteService,
    ExceptionLogRepository,
    ExceptionLogService,
    ReportsHubService,
    SystemRepository,
    SystemService,
    WeeklyPlanRepository,
    WeeklyPlanService,
    MaterialBalanceRepository,
    MaterialBalanceService,
    CompanyStateRepository,
    CompanyStateService,
    CompanyStateSnapshotCron,
    DirectorHolatService,
    IdealRasmRepository,
    IdealRasmService,
    ProductionFactsRepository,
    ProductionFactsService,
    OrderStatusRepository,
    OrderStatusService,
    ThreeWayMatchRepository,
    ThreeWayMatchService,
  ],
})
export class RemainingModule {}
