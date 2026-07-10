/**
 * @module wms.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { AuthModule } from '../auth/auth.module';
import { WmsStockController } from './presentation/wms-stock.controller';
import { WmsGoodsIssueController } from './presentation/wms-goods-issue.controller';
import { WmsRentalController } from './presentation/wms-rental.controller';
import { WmsEoqController } from './presentation/wms-eoq.controller';
import { WmsAnalyticsController } from './presentation/wms-analytics.controller';
import { WmsEoqService } from './application/wms-eoq.service';
import { WmsAnalyticsService } from './application/wms-analytics.service';
import { EoqCalculatorService } from './domain/services/eoq-calculator.service';
import { SafetyStockService } from './domain/services/safety-stock.service';
import { RopService } from './domain/services/rop.service';
import { InventoryTurnoverService } from './domain/services/inventory-turnover.service';
import { RopTriggerHandler } from './infrastructure/event-handlers/rop-trigger.handler';
import { WmsWarehousesController } from './presentation/wms-warehouses.controller';
import { WmsInventoryController } from './presentation/wms-inventory.controller';
import { WmsExtendedController } from './presentation/wms-extended.controller';
import { WmsCountsController } from './presentation/wms-counts.controller';
import { WmsWarehouseGatewayController } from './presentation/wms-warehouse-gateway.controller';
import { WmsBarcodeController } from './presentation/wms-barcode.controller';
import { WmsCatalogController } from './presentation/wms-catalog.controller';
import {
  WmsCatalogService,
  WmsCatalogAbcAgingExpiryService,
  WmsCatalogStockTurnoverService,
  WmsCatalogDashboardService,
} from './application/wms-catalog.service';
import { WmsIntegrationController } from './presentation/wms-integration.controller';
import { WmsGatewayWarehousesController } from './presentation/wms-gateway-warehouses.controller';
import { WmsGatewayWarehouseLotsController } from './presentation/wms-gateway-warehouse-lots.controller';
import { WmsGatewayBinZoneController } from './presentation/wms-gateway-binszone.controller';
import { WmsGatewayInventoryController } from './presentation/wms-gateway-inventory.controller';
import { InventoryMaterialsController } from './presentation/inventory-materials.controller';
import { IotEnhancedController } from './presentation/iot-enhanced.controller';
import { IotMaterialKitsController } from './presentation/iot-material-kits.controller';
import { WarehouseRentalController } from './presentation/warehouse-rental.controller';
import { InventoryAdvancedController } from './presentation/inventory-advanced.controller';
import { InventoryAdvancedService } from './application/inventory-advanced.service';
import { InventoryAdvancedRepository } from './infrastructure/inventory-advanced.repo';
import { WmsCountsService } from './application/wms-counts.service';
import { WmsCountsRepository } from './infrastructure/repositories/wms-counts.repository';
import { WmsExtendedService } from './application/wms-extended.service';
import { WmsExtendedRepository } from './infrastructure/repositories/wms-extended.repository';
import { WmsWarehouseGatewayService } from './application/wms-warehouse-gateway.service';
import { WmsWarehouseGatewayRepo } from './infrastructure/wms-warehouse-gateway.repo';
import { QuarantineGateService } from './domain/services/quarantine-gate.service';
import { WmsQuarantineGateService } from './application/wms-quarantine-gate.service';
import { WmsQuarantineRepository } from './infrastructure/repositories/wms-quarantine.repository';
import { WMS_QUARANTINE_REPO } from './domain/repositories/i-wms-quarantine.repo';
import { InventoryMaterialsService } from './application/inventory-materials.service';
import { InventoryMaterialsRepository } from './infrastructure/repositories/inventory-materials.repository';
import { IotEnhancedService } from './application/iot-enhanced.service';
import { IotEnhancedRepository } from './infrastructure/repositories/iot-enhanced.repository';
import { WarehouseRentalService } from './application/warehouse-rental.service';
import { WarehouseRentalRepository } from './infrastructure/repositories/warehouse-rental.repository';
import { WmsCrudService } from './application/wms-crud.service';
import { WmsCrudRepository } from './infrastructure/repositories/wms-crud.repository';
import { WMS_COUNTS_REPO } from './domain/repositories/i-wms-counts.repo';
import { WMS_EXTENDED_REPO } from './domain/repositories/i-wms-extended.repo';
import { INVENTORY_MATERIALS_REPO } from './domain/repositories/i-inventory-materials.repo';
import { IOT_ENHANCED_REPO } from './domain/repositories/i-iot-enhanced.repo';
import { WAREHOUSE_RENTAL_REPO } from './domain/repositories/i-warehouse-rental.repo';
import { WMS_CRUD_REPO } from './domain/repositories/i-wms-crud.repo';
import { GoodsIssueHandler } from './application/commands/goods-issue.handler';
import { ReceiveFgHandler } from './application/commands/receive-fg.handler';
import { ReserveMaterialHandler } from './application/commands/reserve-material.handler';
import { CreateWarehouseHandler } from './application/commands/create-warehouse.handler';
import { PatchRentalHandler } from './application/commands/patch-rental.handler';
import { DeleteRentalHandler } from './application/commands/delete-rental.handler';
import { FefoStockHandler } from './application/queries/fefo-stock.handler';
import { GetWarehousesHandler } from './application/queries/get-warehouses.handler';
import { GetStockInventoryHandler } from './application/queries/get-stock-inventory.handler';
import { GetLowStockHandler } from './application/queries/get-low-stock.handler';
import { DrizzleWmsRepository } from './infrastructure/repositories/drizzle-wms.repo';
import { WMS_REPO } from './domain/repositories/wms.repository';
import { QcPassedListener } from './infrastructure/event-handlers/qc-passed.listener';
import { QcFailedFgListener } from './infrastructure/event-handlers/qc-failed-fg.listener';
import { MesCompletedFgListener } from './infrastructure/event-handlers/mes-completed-fg.listener';
import { DeliveryGoodsIssuedListener } from './infrastructure/event-handlers/delivery-goods-issued.listener';
import { WMS_INVENTORY_REPO } from './inventory/i-wms-inventory.repo';
import { DrizzleWmsInventoryRepository } from './inventory/drizzle-wms-inventory.repo';
import { InventoryService } from './inventory/inventory.service';
import { WMS_MOVEMENTS_REPO } from './movements/i-wms-movements.repo';
import { DrizzleWmsMovementsRepository } from './movements/drizzle-wms-movements.repo';
import { MovementsService } from './movements/movements.service';
import { WMS_WAREHOUSES_REPO } from './warehouses/i-wms-warehouses.repo';
import { DrizzleWmsWarehousesRepository } from './warehouses/drizzle-wms-warehouses.repo';
import { WarehousesService } from './warehouses/warehouses.service';
import { RulonCardController } from './presentation/rulon-card.controller';
import { RulonCardService } from './application/rulon-card.service';
import { DrizzleRulonCardRepository } from './infrastructure/repositories/drizzle-rulon-card.repo';
import { RULON_CARD_REPO } from './domain/repositories/i-rulon-card.repo';
import { WmsRollCalcService } from './domain/services/wms-roll-calc.service';
import { WmsOverflowService } from './application/wms-overflow.service';
import { OutboundEnforcementService } from './application/outbound-enforcement.service';
// W3-COUNT — inventarizatsiya kuchaytirish (ko'r-sanoq, og'ish-sabab, zona-muzlatish).
import { InventoryFreezeService } from './application/inventory-freeze.service';
import { InventoryFreezeRepository } from './infrastructure/repositories/inventory-freeze.repository';
import { INVENTORY_FREEZE_REPO } from './domain/repositories/i-inventory-freeze.repo';
import { WmsOverflowController } from './presentation/wms-overflow.controller';
// W1-INTRANSIT — import xom-ashyo YO'LDA kuzatuvi + bojxona/import hujjatlari.
import { WmsInTransitController } from './presentation/wms-in-transit.controller';
import { WmsInTransitService } from './application/wms-in-transit.service';
import { WmsInTransitRepository } from './infrastructure/repositories/wms-in-transit.repository';
import { WMS_IN_TRANSIT_REPO } from './domain/repositories/i-wms-in-transit.repo';
// W2-SUPPLIER-RATING — ta'minotchi ishonchlilik reytingi (EP-WMS-094/022).
import { SupplierRatingService } from './application/supplier-rating.service';
import { SupplierRatingRepository } from './infrastructure/repositories/supplier-rating.repository';
import { SUPPLIER_RATING_REPO } from './domain/repositories/i-supplier-rating.repo';
import { SupplierRatingListener } from './infrastructure/event-handlers/supplier-rating.listener';
import { WmsSupplierRatingController } from './presentation/wms-supplier-rating.controller';
// W4-MATERIAL-LIFE — material hayot-tsikli atributlari + analog (EP-WMS-101/123/125/126/128/130/086).
import { MaterialLifeController } from './presentation/material-life.controller';
import { MaterialLifeService } from './application/material-life.service';
import { MaterialLifeRepository } from './infrastructure/repositories/material-life.repository';
import { MATERIAL_LIFE_REPO } from './domain/repositories/i-material-life.repo';
// FAZA E (Inventarizatsiya, 2026-07-01) — "Davriy (rejalashtirilgan)" cycle-count avto-generatsiya.
import { WmsCycleCountGeneratorCron } from './infrastructure/cron/wms-cycle-count-generator.cron';
// Vizyon 10-warehouse #28 — sanoq aniqlik% <95% darhol signal (Direktorga RBAC marshrut).
import { CountAccuracyAlertCron } from './infrastructure/cron/count-accuracy-alert.cron';
import { NotificationRoutingRepository } from '../notifications/infrastructure/notification-routing.repository';
// Vizyon 10-warehouse#47 — kunlik ombor hisoboti (barcha turlar, bo'sh=0) CRON (NotificationRoutingRepository allaqachon provider).
import { DailyWarehouseReportCron } from './infrastructure/cron/daily-warehouse-report.cron';
// G9-1 (Taksonomiya, 2026-07-02) — bo'lim ichki omborlari org-sxemadan avto-derivatsiya (boot + kunlik cron).
import { DepartmentWarehouseSyncService } from './infrastructure/cron/department-warehouse-sync.service';
// FAZA "Sozlama har bo'limda" (2026-07-01) — Ombor sozlama-hub (SD/Marketing/QC pattern reuse).
import { WmsSettingsController } from './presentation/wms-settings.controller';
import { WmsSettingsService } from './application/wms-settings.service';
import { WmsSettingsRepository } from './infrastructure/repositories/wms-settings.repository';
import { WMS_SETTINGS_REPO } from './domain/repositories/i-wms-settings.repo';
// Vision 10-warehouse #65 (TASDIQ-2146 §10 #65) — avans↔yetkazish bog'lanishi (yopilmagan avanslar), kross-modul READ-model.
import { AdvanceLinkageController } from './presentation/advance-linkage.controller';
import { AdvanceLinkageService } from './application/advance-linkage.service';
import { AdvanceLinkageRepository } from './infrastructure/repositories/advance-linkage.repository';
// Vision 10-warehouse #30 - off-hours (outside-shift) warehouse-movement flag + weekly HR/Director report.
import { NotificationsModule } from '../notifications/notifications.module';
import { OffHoursAuditRepository } from './infrastructure/repositories/off-hours-audit.repository';
import { OffHoursAuditService } from './application/off-hours-audit.service';
import { OffHoursReportCron } from './infrastructure/cron/off-hours-report.cron';
// WMS #32 (vizyon 10-warehouse.md #32) — "Rohler chaqiruv" 15/30/60 daqiqa eskalatsiya (cron→service→repo).
import { InternalRequestEscalationCron } from './infrastructure/cron/internal-request-escalation.cron';
import { InternalRequestEscalationService } from './application/internal-request-escalation.service';
import { InternalRequestEscalationRepository } from './infrastructure/repositories/internal-request-escalation.repository';
// Vision 10-warehouse #29 — namuna/probnik chiqim 'NAMUNA' kod bilan hisobotda (sample-issue tagging) READ-model.
import { SampleIssueReportRepository } from './infrastructure/repositories/sample-issue-report.repository';
import { SampleIssueReportService } from './application/sample-issue-report.service';
import { SampleIssueReportController } from './presentation/sample-issue-report.controller';
// Vision 10-warehouse #4 — Ochiq PR miqdori ogohlantirish bayrog'i (open-PR-quantity warning flag).
import { OpenPrWarningController } from './presentation/open-pr-warning.controller';
import { OpenPrWarningService } from './application/open-pr-warning.service';
import { OpenPrWarningRepository } from './infrastructure/repositories/open-pr-warning.repository';

const handlers = [
  GoodsIssueHandler,
  ReceiveFgHandler,
  ReserveMaterialHandler,
  FefoStockHandler,
  CreateWarehouseHandler,
  GetWarehousesHandler,
  GetStockInventoryHandler,
  GetLowStockHandler,
  PatchRentalHandler,
  DeleteRentalHandler,
];

const listeners = [QcPassedListener, QcFailedFgListener, MesCompletedFgListener, DeliveryGoodsIssuedListener, RopTriggerHandler, SupplierRatingListener];

@Module({
  imports: [
    AuthModule,
    CqrsModule,
    EventEmitterModule.forRoot(),
    BullModule.registerQueue({ name: QUEUE_NAMES.MRP_RUN }),
    NotificationsModule,
  ],
  controllers: [
    WmsStockController,
    WmsGoodsIssueController,
    WmsRentalController,
    WmsWarehousesController,
    WmsInventoryController,
    WmsExtendedController,
    WmsCountsController,
    WmsWarehouseGatewayController,
    WmsGatewayWarehousesController,
    WmsGatewayWarehouseLotsController,
    WmsGatewayBinZoneController,
    WmsGatewayInventoryController,
    WmsBarcodeController,
    WmsCatalogController,
    WmsIntegrationController,
    InventoryMaterialsController,
    IotEnhancedController,
    IotMaterialKitsController,
    WarehouseRentalController,
    InventoryAdvancedController,
    WmsEoqController,
    WmsAnalyticsController,
    RulonCardController,
    WmsOverflowController,
    WmsInTransitController,
    MaterialLifeController,
    WmsSupplierRatingController,
    WmsSettingsController,
    AdvanceLinkageController,
    SampleIssueReportController,
    OpenPrWarningController,
  ],
  providers: [
    ...handlers,
    ...listeners,
    { provide: WMS_REPO, useClass: DrizzleWmsRepository },
    { provide: WMS_INVENTORY_REPO, useClass: DrizzleWmsInventoryRepository },
    InventoryService,
    { provide: WMS_MOVEMENTS_REPO, useClass: DrizzleWmsMovementsRepository },
    MovementsService,
    { provide: WMS_WAREHOUSES_REPO, useClass: DrizzleWmsWarehousesRepository },
    WarehousesService,
    WmsCountsRepository,
    { provide: WMS_COUNTS_REPO, useClass: WmsCountsRepository },
    WmsCountsService,
    WmsExtendedRepository,
    { provide: WMS_EXTENDED_REPO, useClass: WmsExtendedRepository },
    WmsExtendedService,
    WmsWarehouseGatewayRepo,
    WmsWarehouseGatewayService,
    QuarantineGateService,
    WmsQuarantineGateService,
    WmsQuarantineRepository,
    { provide: WMS_QUARANTINE_REPO, useClass: WmsQuarantineRepository },
    InventoryMaterialsRepository,
    { provide: INVENTORY_MATERIALS_REPO, useClass: InventoryMaterialsRepository },
    InventoryMaterialsService,
    IotEnhancedRepository,
    { provide: IOT_ENHANCED_REPO, useClass: IotEnhancedRepository },
    IotEnhancedService,
    WarehouseRentalRepository,
    { provide: WAREHOUSE_RENTAL_REPO, useClass: WarehouseRentalRepository },
    WarehouseRentalService,
    InventoryAdvancedService,
    InventoryAdvancedRepository,
    WmsCrudRepository,
    { provide: WMS_CRUD_REPO, useClass: WmsCrudRepository },
    WmsCrudService,
    WmsCatalogAbcAgingExpiryService,
    WmsCatalogStockTurnoverService,
    WmsCatalogDashboardService,
    WmsCatalogService,
    EoqCalculatorService,
    SafetyStockService,
    RopService,
    InventoryTurnoverService,
    WmsEoqService,
    WmsAnalyticsService,
    // Rulon qog'oz karta (paper-roll card) — WMS core (PROMT-08 §PHASE 3).
    WmsRollCalcService,
    DrizzleRulonCardRepository,
    { provide: RULON_CARD_REPO, useClass: DrizzleRulonCardRepository },
    RulonCardService,
    // WMS overflow (idish-yaxlitlash, OMBOR-INTERVYU §2) + chiqim hard-gate'lar (EP-WMS-084/085).
    WmsOverflowService,
    OutboundEnforcementService,
    // W3-COUNT — inventarizatsiya muzlatish + og'ish-sabab; chiqim-gate (GoodsIssueHandler) tekshiradi.
    InventoryFreezeRepository,
    { provide: INVENTORY_FREEZE_REPO, useClass: InventoryFreezeRepository },
    InventoryFreezeService,
    // W1-INTRANSIT — import yo'lda kuzatuvi (arrived → mavjud karantin darvozasi).
    WmsInTransitRepository,
    { provide: WMS_IN_TRANSIT_REPO, useClass: WmsInTransitRepository },
    WmsInTransitService,
    // W2-SUPPLIER-RATING — 4-faktor reyting (oxirgi oyna) + QC-fail tetiklagich.
    SupplierRatingRepository,
    { provide: SUPPLIER_RATING_REPO, useClass: SupplierRatingRepository },
    SupplierRatingService,
    // W4-MATERIAL-LIFE — material hayot-tsikli atributlari + analog (substitute).
    MaterialLifeRepository,
    { provide: MATERIAL_LIFE_REPO, useClass: MaterialLifeRepository },
    MaterialLifeService,
    // FAZA E (Inventarizatsiya, 2026-07-01) — davriy (rejalashtirilgan) cycle-count avto-generatsiya.
    WmsCycleCountGeneratorCron,
    // Vizyon 10-warehouse #28 — sanoq aniqlik% <95% darhol signal (RBAC marshrut → Direktor).
    // NotificationRoutingRepository — standalone provider (faqat runQuery), pos.module.ts namunasi.
    NotificationRoutingRepository,
    CountAccuracyAlertCron,
    // Vizyon 10-warehouse#47 — kunlik ombor hisoboti CRON (WmsCatalogDashboardService + config-driven routing).
    DailyWarehouseReportCron,
    // G9-1 (Taksonomiya, 2026-07-02) — bo'lim ichki omborlari avto-sinxron (vizyon CHAT-TARIXI:52).
    DepartmentWarehouseSyncService,
    // FAZA "Sozlama har bo'limda" (2026-07-01) — Ombor sozlama-hub.
    { provide: WMS_SETTINGS_REPO, useClass: WmsSettingsRepository },
    WmsSettingsService,
    // Vision 10-warehouse #65 (TASDIQ-2146 §10 #65) — avans↔yetkazish (yopilmagan avanslar) READ-model.
    AdvanceLinkageRepository,
    AdvanceLinkageService,
    // Vision 10-warehouse #30 - off-hours (outside-shift) warehouse-movement flag + weekly HR/Director report.
    OffHoursAuditRepository,
    OffHoursAuditService,
    OffHoursReportCron,
    // WMS #32 (vizyon 10-warehouse.md #32) — "Rohler chaqiruv" 15/30/60 daqiqa eskalatsiya.
    InternalRequestEscalationRepository,
    InternalRequestEscalationService,
    InternalRequestEscalationCron,
    // Vision 10-warehouse #29 — namuna/probnik chiqim hisobot READ-model (sample-issue tagging).
    SampleIssueReportRepository,
    SampleIssueReportService,
    // Vision 10-warehouse #4 — open-PR-quantity warning (recompute comparison job + read model).
    OpenPrWarningRepository,
    OpenPrWarningService,
  ],
  exports: [WMS_REPO],
})
export class WmsModule {}
