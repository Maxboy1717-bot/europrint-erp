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
import { PpQueueController } from './presentation/pp-queue.controller';
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
import { UpdateWorkCenterNormsHandler } from './application/commands/update-work-center-norms.command';
import { LinkWorkCenterCardHandler } from './application/commands/link-work-center-card.command';
import { ProductionPlanHandler } from './application/queries/production-plan.handler';
import { MachineLoadHandler } from './application/queries/machine-load.handler';
import { GetProductionOrdersHandler } from './application/queries/get-production-orders.handler';
import { GetProductionOrderByIdHandler } from './application/queries/get-production-order-by-id.handler';
import { GetBomsHandler } from './application/queries/get-boms.handler';
import { GetRoutingsHandler } from './application/queries/get-routings.handler';
import { GetMrpReportHandler } from './application/queries/get-mrp-report.handler';
import { GetWorkCentersHandler } from './application/queries/get-work-centers.handler';
import { GetProductionQueueHandler } from './application/queries/get-production-queue.handler';
import { GetSalesOrderQueuePositionHandler } from './application/queries/get-sales-order-queue-position.handler';
import { PpPlanExportService } from './application/services/pp-plan-export.service';
import { GetWorkCentersStatsHandler } from './application/queries/get-work-centers-stats.handler';
import { DrizzlePpRepository } from './infrastructure/repositories/drizzle-pp.repo';
import { DrizzleWorkCenterRepository } from './infrastructure/repositories/drizzle-work-center.repo';
import { PP_REPO, WORK_CENTER_REPO } from './domain/repositories/pp.repository';
import { AdvanceApprovedListener } from './infrastructure/event-handlers/advance-approved.listener';
import { SalesOrderReadyPlanningListener } from './infrastructure/event-handlers/sales-order-ready-planning.listener';
import { MroStopListener } from './infrastructure/event-handlers/mro-stop.listener';
// Wave 4 round-2 (PA2-18): DesignLabCompletedListener split into two
// canonical @EventsHandler listeners + a shared join service.
import { DesignApprovedTrigger5Listener } from './infrastructure/event-handlers/design-approved-trigger5.listener';
import { LabTestPassedTrigger5Listener } from './infrastructure/event-handlers/lab-test-passed-trigger5.listener';
import { DesignLabJoinService } from './infrastructure/event-handlers/design-lab-join.service';
import { WmsGoodsIssuedListener } from './infrastructure/event-handlers/wms-goods-issued.listener';
// T27-A2-QC-REWORK: QC's third-decision REWORK path returns the inspected
// production order to PP so MES re-plans it (golden thread: SD→PP→MES→QC→rework→MES).
import { QcReworkListener } from './infrastructure/event-handlers/qc-rework.listener';
import { PP_PRODUCTION_ORDERS_REPO } from './production-orders/i-pp-production-orders.repo';
import { DrizzlePpProductionOrdersRepository } from './production-orders/drizzle-pp-production-orders.repo';
import { ProductionOrdersService } from './production-orders/production-orders.service';
import { PP_BOM_REPO } from './bom/i-pp-bom.repo';
import { DrizzlePpBomRepository } from './bom/drizzle-pp-bom.repo';
import { BomService } from './bom/bom.service';
import { PP_ROUTINGS_REPO } from './routings/i-pp-routings.repo';
import { DrizzlePpRoutingsRepository } from './routings/drizzle-pp-routings.repo';
import { RoutingsService } from './routings/routings.service';
import { SchedulingJohnsonService } from './domain/services/scheduling-johnson.service';
import { SchedulingNetworkService } from './domain/services/scheduling-network.service';
import { SchedulingCapacityService } from './domain/services/scheduling-capacity.service';
import { SchedulingService } from './domain/services/scheduling.service';
import { CrpService } from './domain/services/crp.service';
import { LearningCurveService } from './domain/services/learning-curve.service';
import { ProductionPriorityService } from './domain/services/production-priority.service';
import { MpsAtpHandler } from './application/queries/mps-atp.handler';
import { RunMrpHandler } from './application/commands/run-mrp.handler';
import { BomExplosionService } from './domain/services/bom-explosion.service';
import { PpIntelligenceService } from './application/services/pp-intelligence.service';
import { PpMpsService } from './application/services/pp-mps.service';
import { PpCrpService } from './application/services/pp-crp.service';
import { PpFailoverService } from './application/services/pp-failover.service';
import { PpFailoverRepository } from './infrastructure/repositories/pp-failover.repo';
import { PpAiPlanningService } from './application/services/pp-ai-planning.service';
import { PpIntelligenceController } from './presentation/pp-intelligence.controller';
// PA3-17 Wave 5: merged from former modules/technology/ (route prefix '/technology' preserved)
import { TechnologyController } from './technology/technology.controller';
import { TechnologyService } from './technology/technology.service';
import { TechnologyRepository } from './technology/technology.repository';
import { TechnologyGrammageService } from './technology/technology-grammage.service';
import { TechnologySchemaService } from './technology/technology-schema.service';
import { TechnologySchemaRepository } from './technology/technology-schema.repository';
// PA3-17 Wave 6: merged from former modules/production/ (route prefixes '/production' and '/production/shift-reports' preserved)
import { ProductionShiftReportsController } from './production/production-shift-reports.controller';
import { ProductionReportsController } from './production/production-reports.controller';
import { ProductionService } from './production/production.service';
import { ProductionRepository } from './production/production.repository';
// ⭐ Gofra/Sloy 3-formula conversion engine (kg↔m²↔list) — vision §29
import { GofraConversionController } from './conversion/gofra-conversion.controller';
import { GofraConversionService } from './conversion/gofra-conversion.service';
import { GOFRA_FACTORS_REPO } from './conversion/i-gofra-factors.repo';
import { DrizzleGofraFactorsRepo } from './conversion/drizzle-gofra-factors.repo';
// PP reason-code catalog (pp_reason_codes) — structured reason vocabulary for the
// order-flags path (production_orders.reason_code_id, VISION-3340 #23). Management
// surface so the FE can list/create/patch codes to populate reasonCodeId.
import { PpReasonCodesController } from './reason-codes/pp-reason-codes.controller';
import { PpReasonCodesService } from './reason-codes/pp-reason-codes.service';
import { PP_REASON_CODES_REPO } from './reason-codes/i-pp-reason-codes.repo';
import { DrizzlePpReasonCodesRepository } from './reason-codes/drizzle-pp-reason-codes.repo';
// Vision 07-pp#30 (EP-PP-068): PP material-reservation ledger — priority + FIFO tie-break
// + director-only manual override. New pp_material_reservations table.
import { PpMaterialReservationsController } from './material-reservations/pp-material-reservations.controller';
import { PpMaterialReservationsService } from './material-reservations/pp-material-reservations.service';
import { PP_MATERIAL_RESERVATIONS_REPO } from './material-reservations/i-pp-material-reservations.repo';
import { DrizzlePpMaterialReservationsRepository } from './material-reservations/drizzle-pp-material-reservations.repo';
// PP gang-run per-order acceptance act + lot-split brak (pp_gang_runs / pp_gang_run_orders,
// vision 07-pp#37). Groups several production orders on one print job; accept splits brak.
import { PpGangRunsController } from './gang-runs/pp-gang-runs.controller';
import { PpGangRunsService } from './gang-runs/pp-gang-runs.service';
import { PP_GANG_RUNS_REPO } from './gang-runs/i-pp-gang-runs.repo';
import { DrizzlePpGangRunsRepository } from './gang-runs/drizzle-pp-gang-runs.repo';
// Plan-fact store (pp_plan_fact_entries) — vision 07-pp#20 (EP-PP-106) last-year-fact
// recommendation (median + best-20% + last-5).
import { PpPlanFactController } from './plan-fact/pp-plan-fact.controller';
import { PpPlanFactService } from './plan-fact/pp-plan-fact.service';
import { PP_PLAN_FACT_REPO } from './plan-fact/i-pp-plan-fact.repo';
import { DrizzlePpPlanFactRepository } from './plan-fact/drizzle-pp-plan-fact.repo';
// vision 07-pp#46: operation queue-time tracker -- queue (waiting-for-next-stage) time is
// tracked distinct from active work and EXCLUDED from the OEE availability denominator.
import { PpOeeController } from './oee/pp-oee.controller';
import { PpQueueTimeService } from './oee/pp-queue-time.service';
import { PP_QUEUE_TIME_REPO } from './oee/i-pp-queue-time.repo';
import { DrizzlePpQueueTimeRepository } from './oee/drizzle-pp-queue-time.repo';

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
  UpdateWorkCenterNormsHandler,
  LinkWorkCenterCardHandler,
  GetWorkCentersHandler,
  GetWorkCentersStatsHandler,
  GetProductionQueueHandler,
  GetSalesOrderQueuePositionHandler,
];

const listeners = [
  SalesOrderReadyPlanningListener,    // Golden-thread SD→PP entry (sales order confirm → production plan)
  AdvanceApprovedListener,            // Trigger 7
  MroStopListener,                    // Trigger 18
  DesignApprovedTrigger5Listener,     // Trigger 5 (design side, Wave 4 round-2)
  LabTestPassedTrigger5Listener,      // Trigger 5 (lab side, Wave 4 round-2)
  WmsGoodsIssuedListener,             // Trigger 9
  QcReworkListener,                   // T27-A2-QC-REWORK
];

@Module({
  imports: [CqrsModule, EventEmitterModule.forRoot()],
  controllers: [PpOrdersController, PpBomController, PpRoutingController, PpWorkCentersController, PpPlanningController, PpEquipmentController, PpQueueController, PpIntelligenceController,
    // Vision 07-pp#30: material reserve priority + FIFO tie-break + director override
    PpMaterialReservationsController,
    // PA3-17 Wave 5: merged from modules/technology/
    TechnologyController,
    // PA3-17 Wave 6: merged from modules/production/
    ProductionShiftReportsController,
    ProductionReportsController,
    // ⭐ Gofra 3-formula conversion entry
    GofraConversionController,
    // PP reason-code catalog management surface
    PpReasonCodesController,
    // PP gang-run acceptance + brak-split surface (vision 07-pp#37)
    PpGangRunsController,
    // Plan-fact recommendation surface (vision 07-pp#20)
    PpPlanFactController,
    // vision 07-pp#46: queue-time tracker + OEE queue-exclusion surface
    PpOeeController,
  ],
  providers: [
    // Vision 07-pp#30: material-reservation ledger (priority + FIFO tie-break + director override)
    PpMaterialReservationsService,
    { provide: PP_MATERIAL_RESERVATIONS_REPO, useClass: DrizzlePpMaterialReservationsRepository },
    ...handlers,
    ...listeners,
    DesignLabJoinService,            // Wave 4 round-2: shared by Trigger 5 split listeners
    { provide: PP_REPO, useClass: DrizzlePpRepository },
    { provide: WORK_CENTER_REPO, useClass: DrizzleWorkCenterRepository },
    { provide: PP_PRODUCTION_ORDERS_REPO, useClass: DrizzlePpProductionOrdersRepository },
    ProductionOrdersService,
    { provide: PP_BOM_REPO, useClass: DrizzlePpBomRepository },
    BomService,
    { provide: PP_ROUTINGS_REPO, useClass: DrizzlePpRoutingsRepository },
    RoutingsService,
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
    ProductionPriorityService,
    PpPlanExportService,            // EP-PP-129: ranked-plan CSV snapshot serializer (pure, Rule 15)
    BomExplosionService,
    MpsAtpHandler,
    RunMrpHandler,
    PpIntelligenceService,
    PpMpsService,
    PpCrpService,
    PpFailoverService,              // 07-pp#24: alternative-work-center fail-over on downtime + CRP recompute
    PpFailoverRepository,           // 07-pp#24: owns the re-route write on routing_operations
    PpAiPlanningService,            // A50: 7-step AI-planning skeleton (AI-key gated)
    // PA3-17 Wave 5: merged from modules/technology/
    TechnologyService,
    TechnologyRepository,
    TechnologySchemaService,
    TechnologySchemaRepository,
    // ⭐ Gofra 3-formula consumer for tech cards (reuses GofraConversionService)
    TechnologyGrammageService,
    // PA3-17 Wave 6: merged from modules/production/
    ProductionService,
    ProductionRepository,
    // ⭐ Gofra 3-formula conversion engine
    GofraConversionService,
    { provide: GOFRA_FACTORS_REPO, useClass: DrizzleGofraFactorsRepo },
    // PP reason-code catalog
    PpReasonCodesService,
    { provide: PP_REASON_CODES_REPO, useClass: DrizzlePpReasonCodesRepository },
    // PP gang-run acceptance + brak-split (vision 07-pp#37)
    PpGangRunsService,
    { provide: PP_GANG_RUNS_REPO, useClass: DrizzlePpGangRunsRepository },
    // Plan-fact store (vision 07-pp#20)
    PpPlanFactService,
    { provide: PP_PLAN_FACT_REPO, useClass: DrizzlePpPlanFactRepository },
    // vision 07-pp#46: queue-time tracker + OEE queue-exclusion
    PpQueueTimeService,
    { provide: PP_QUEUE_TIME_REPO, useClass: DrizzlePpQueueTimeRepository },
  ],
  exports: [PP_REPO, WORK_CENTER_REPO, BomExplosionService, ProductionService, GofraConversionService],
})
export class PpModule {}
