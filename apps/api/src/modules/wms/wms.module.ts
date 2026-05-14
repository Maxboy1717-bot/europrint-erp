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
import { RopTriggerHandler } from './infrastructure/event-handlers/rop-trigger.handler';
import { WmsWarehousesController } from './presentation/wms-warehouses.controller';
import { WmsInventoryController } from './presentation/wms-inventory.controller';
import { WmsExtendedController } from './presentation/wms-extended.controller';
import { WmsCountsController } from './presentation/wms-counts.controller';
import { WmsWarehouseGatewayController } from './presentation/wms-warehouse-gateway.controller';
import { WmsBarcodeController } from './presentation/wms-barcode.controller';
import { WmsCatalogController } from './presentation/wms-catalog.controller';
import { WmsCatalogService } from './application/wms-catalog.service';
import { WmsIntegrationController } from './presentation/wms-integration.controller';
import { WmsGatewayWarehousesController } from './presentation/wms-gateway-warehouses.controller';
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
import { WmsCountsRepository } from './application/wms-counts.repository';
import { WmsExtendedService } from './application/wms-extended.service';
import { WmsExtendedRepository } from './application/wms-extended.repository';
import { WmsWarehouseGatewayService } from './application/wms-warehouse-gateway.service';
import { WmsWarehouseGatewayRepo } from './infrastructure/wms-warehouse-gateway.repo';
import { InventoryMaterialsService } from './application/inventory-materials.service';
import { InventoryMaterialsRepository } from './application/inventory-materials.repository';
import { IotEnhancedService } from './application/iot-enhanced.service';
import { IotEnhancedRepository } from './application/iot-enhanced.repository';
import { WarehouseRentalService } from './application/warehouse-rental.service';
import { WarehouseRentalRepository } from './application/warehouse-rental.repository';
import { WmsCrudService } from './application/wms-crud.service';
import { WmsCrudRepository } from './application/wms-crud.repository';
import { GoodsIssueHandler } from './application/commands/goods-issue.handler';
import { ReceiveFgHandler } from './application/commands/receive-fg.handler';
import { ReserveMaterialHandler } from './application/commands/reserve-material.handler';
import { CreateWarehouseHandler } from './application/commands/create-warehouse.handler';
import { FefoStockHandler } from './application/queries/fefo-stock.handler';
import { GetWarehousesHandler } from './application/queries/get-warehouses.handler';
import { GetStockInventoryHandler } from './application/queries/get-stock-inventory.handler';
import { GetLowStockHandler } from './application/queries/get-low-stock.handler';
import { DrizzleWmsRepository } from './infrastructure/repositories/drizzle-wms.repo';
import { QcPassedListener } from './infrastructure/event-handlers/qc-passed.listener';
import { WMS_INVENTORY_REPO } from './inventory/i-wms-inventory.repo';
import { DrizzleWmsInventoryRepository } from './inventory/drizzle-wms-inventory.repo';
import { InventoryService } from './inventory/inventory.service';
import { WMS_MOVEMENTS_REPO } from './movements/i-wms-movements.repo';
import { DrizzleWmsMovementsRepository } from './movements/drizzle-wms-movements.repo';
import { MovementsService } from './movements/movements.service';
import { WMS_WAREHOUSES_REPO } from './warehouses/i-wms-warehouses.repo';
import { DrizzleWmsWarehousesRepository } from './warehouses/drizzle-wms-warehouses.repo';
import { WarehousesService } from './warehouses/warehouses.service';

const handlers = [
  GoodsIssueHandler,
  ReceiveFgHandler,
  ReserveMaterialHandler,
  FefoStockHandler,
  CreateWarehouseHandler,
  GetWarehousesHandler,
  GetStockInventoryHandler,
  GetLowStockHandler,
];

const listeners = [QcPassedListener, RopTriggerHandler];

@Module({
  imports: [
    AuthModule,
    CqrsModule,
    EventEmitterModule.forRoot(),
    BullModule.registerQueue({ name: QUEUE_NAMES.MRP_RUN }),
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
  ],
  providers: [
    ...handlers,
    ...listeners,
    { provide: 'IWmsRepository', useClass: DrizzleWmsRepository },
    { provide: WMS_INVENTORY_REPO, useClass: DrizzleWmsInventoryRepository },
    InventoryService,
    { provide: WMS_MOVEMENTS_REPO, useClass: DrizzleWmsMovementsRepository },
    MovementsService,
    { provide: WMS_WAREHOUSES_REPO, useClass: DrizzleWmsWarehousesRepository },
    WarehousesService,
    WmsCountsRepository,
    WmsCountsService,
    WmsExtendedRepository,
    WmsExtendedService,
    WmsWarehouseGatewayRepo,
    WmsWarehouseGatewayService,
    InventoryMaterialsRepository,
    InventoryMaterialsService,
    IotEnhancedRepository,
    IotEnhancedService,
    WarehouseRentalRepository,
    WarehouseRentalService,
    InventoryAdvancedService,
    InventoryAdvancedRepository,
    WmsCrudRepository,
    WmsCrudService,
    WmsCatalogService,
    EoqCalculatorService,
    SafetyStockService,
    WmsEoqService,
    WmsAnalyticsService,
  ],
  exports: ['IWmsRepository'],
})
export class WmsModule {}
