/**
 * @module pp.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PpOrdersController } from './presentation/pp-orders.controller';
import { PpBomController } from './presentation/pp-bom.controller';
import { PpRoutingController } from './presentation/pp-routing.controller';
import { PpWorkCentersController } from './presentation/pp-work-centers.controller';
import { PpPlanningController } from './presentation/pp-planning.controller';
import { PpEquipmentController } from './presentation/pp-equipment.controller';
import { PpPlanningService } from './application/pp-planning.service';
import { PpPlanningRepository } from './infrastructure/repositories/pp-planning.repository';
import { PP_PLANNING_REPO } from './domain/repositories/i-pp-planning.repo';
import { PpEquipmentService } from './application/pp-equipment.service';
import { PpEquipmentRepository } from './infrastructure/repositories/pp-equipment.repository';
import { PP_EQUIPMENT_REPO } from './domain/repositories/i-pp-equipment.repo';
import { CreateProductionOrderHandler } from './application/commands/create-production-order.handler';
import { ReleaseProductionOrderHandler } from './application/commands/release-production-order.handler';
import { ApproveBomHandler } from './application/commands/approve-bom.handler';
import { ApproveRoutingHandler } from './application/commands/approve-routing.handler';
import { CreateWorkCenterHandler } from './application/commands/create-work-center.command';
import { UpdateWorkCenterHandler } from './application/commands/update-work-center.command';
import { ProductionPlanHandler } from './application/queries/production-plan.handler';
import { MachineLoadHandler } from './application/queries/machine-load.handler';
import { GetProductionOrdersHandler } from './application/queries/get-production-orders.handler';
import { GetProductionOrderByIdHandler } from './application/queries/get-production-order-by-id.handler';
import { GetBomsHandler } from './application/queries/get-boms.handler';
import { GetRoutingsHandler } from './application/queries/get-routings.handler';
import { GetMrpReportHandler } from './application/queries/get-mrp-report.handler';
import { GetWorkCentersHandler } from './application/queries/get-work-centers.handler';
import { GetWorkCentersStatsHandler } from './application/queries/get-work-centers-stats.handler';
import { DrizzlePpRepository } from './infrastructure/repositories/drizzle-pp.repo';
import { DrizzleWorkCenterRepository } from './infrastructure/repositories/drizzle-work-center.repo';
import { PP_REPO, WORK_CENTER_REPO } from './domain/repositories/pp.repository';
import { AdvanceApprovedListener } from './infrastructure/event-handlers/advance-approved.listener';
import { MroStopListener } from './infrastructure/event-handlers/mro-stop.listener';
import { DesignLabCompletedListener } from './infrastructure/event-handlers/design-lab-completed.listener';
import { WmsGoodsIssuedListener } from './infrastructure/event-handlers/wms-goods-issued.listener';
import { PP_PRODUCTION_ORDERS_REPO } from './production-orders/i-pp-production-orders.repo';
import { DrizzlePpProductionOrdersRepository } from './production-orders/drizzle-pp-production-orders.repo';
import { ProductionOrdersService } from './production-orders/production-orders.service';
import { PP_BOM_REPO } from './bom/i-pp-bom.repo';
import { DrizzlePpBomRepository } from './bom/drizzle-pp-bom.repo';
import { BomService } from './bom/bom.service';
import { PP_ROUTINGS_REPO } from './routings/i-pp-routings.repo';
import { DrizzlePpRoutingsRepository } from './routings/drizzle-pp-routings.repo';
import { RoutingsService } from './routings/routings.service';
import { PP_WORK_CENTERS_REPO } from './work-centers/i-pp-work-centers.repo';
import { DrizzlePpWorkCentersRepository } from './work-centers/drizzle-pp-work-centers.repo';
import { WorkCentersService } from './work-centers/work-centers.service';
import { SchedulingJohnsonService } from './domain/services/scheduling-johnson.service';
import { SchedulingNetworkService } from './domain/services/scheduling-network.service';
import { SchedulingCapacityService } from './domain/services/scheduling-capacity.service';
import { SchedulingService } from './domain/services/scheduling.service';
import { CrpService } from './domain/services/crp.service';
import { LearningCurveService } from './domain/services/learning-curve.service';
import { MpsAtpHandler } from './application/queries/mps-atp.handler';
import { RunMrpHandler } from './application/commands/run-mrp.handler';
import { BomExplosionService } from './domain/services/bom-explosion.service';
import { PpIntelligenceService } from './application/services/pp-intelligence.service';
import { PpMpsService } from './application/services/pp-mps.service';
import { PpCrpService } from './application/services/pp-crp.service';
import { PpIntelligenceController } from './presentation/pp-intelligence.controller';

const handlers = [
  CreateProductionOrderHandler,
  ReleaseProductionOrderHandler,
  ApproveBomHandler,
  ApproveRoutingHandler,
  ProductionPlanHandler,
  MachineLoadHandler,
  GetProductionOrdersHandler,
  GetProductionOrderByIdHandler,
  GetBomsHandler,
  GetRoutingsHandler,
  GetMrpReportHandler,
  CreateWorkCenterHandler,
  UpdateWorkCenterHandler,
  GetWorkCentersHandler,
  GetWorkCentersStatsHandler,
];

const listeners = [
  AdvanceApprovedListener,         // Trigger 7
  MroStopListener,                 // Trigger 18
  DesignLabCompletedListener,      // Trigger 5
  WmsGoodsIssuedListener,          // Trigger 9
];

@Module({
  imports: [CqrsModule, EventEmitterModule.forRoot()],
  controllers: [PpOrdersController, PpBomController, PpRoutingController, PpWorkCentersController, PpPlanningController, PpEquipmentController, PpIntelligenceController],
  providers: [
    ...handlers,
    ...listeners,
    { provide: PP_REPO, useClass: DrizzlePpRepository },
    { provide: WORK_CENTER_REPO, useClass: DrizzleWorkCenterRepository },
    { provide: PP_PRODUCTION_ORDERS_REPO, useClass: DrizzlePpProductionOrdersRepository },
    ProductionOrdersService,
    { provide: PP_BOM_REPO, useClass: DrizzlePpBomRepository },
    BomService,
    { provide: PP_ROUTINGS_REPO, useClass: DrizzlePpRoutingsRepository },
    RoutingsService,
    { provide: PP_WORK_CENTERS_REPO, useClass: DrizzlePpWorkCentersRepository },
    WorkCentersService,
    PpPlanningRepository,
    { provide: PP_PLANNING_REPO, useClass: PpPlanningRepository },
    PpPlanningService,
    PpEquipmentRepository,
    { provide: PP_EQUIPMENT_REPO, useClass: PpEquipmentRepository },
    PpEquipmentService,
    SchedulingJohnsonService,
    SchedulingNetworkService,
    SchedulingCapacityService,
    SchedulingService,
    CrpService,
    LearningCurveService,
    BomExplosionService,
    MpsAtpHandler,
    RunMrpHandler,
    PpIntelligenceService,
    PpMpsService,
    PpCrpService,
  ],
  exports: [PP_REPO, WORK_CENTER_REPO],
})
export class PpModule {}
