/**
 * @module mm.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from '../auth/auth.module';
import { MmMaterialsController } from './presentation/mm-materials.controller';
import { MmPurchaseOrdersController } from './presentation/mm-purchase-orders.controller';
import { MmVendorsPrController } from './presentation/mm-vendors-pr.controller';
import { MmGoodsController }    from './presentation/mm-goods.controller';
import { MmRawMaterialsController } from './presentation/mm-raw-materials.controller';
import { MmMaterialCardsController } from './presentation/mm-material-cards.controller';
import { MmDashboardController } from './presentation/mm-dashboard.controller';
import { MmMaterialsExtrasService } from './application/mm-materials-extras.service';
import { MmMaterialsExtrasRepository } from './infrastructure/repositories/mm-materials-extras.repository';
import { MM_MATERIALS_EXTRAS_REPO } from './domain/repositories/i-mm-materials-extras.repo';
import { MmDashboardService } from './application/mm-dashboard.service';
import { MmDashboardRepository } from './infrastructure/repositories/mm-dashboard.repository';
import { MM_DASHBOARD_REPO } from './domain/repositories/i-mm-dashboard.repo';
import { CreatePurchaseOrderHandler } from './application/commands/create-purchase-order.handler';
import { ApprovePurchaseOrderHandler } from './application/commands/approve-purchase-order.handler';
import { GoodsReceiptHandler } from './application/commands/goods-receipt.handler';
import { CreateMaterialHandler } from './application/commands/create-material.handler';
import { UpdateMaterialHandler } from './application/commands/update-material.handler';
import { GetPurchaseOrdersHandler } from './application/queries/get-purchase-orders.handler';
import { GetVendorsHandler } from './application/queries/get-vendors.handler';
import { GetMaterialsHandler } from './application/queries/get-materials.handler';
import { DrizzleMmRepository } from './infrastructure/repositories/drizzle-mm.repo';
import { DrizzleMaterialRepository } from './infrastructure/repositories/drizzle-material.repo';
import { MM_REPO, MM_MATERIAL_REPO } from './domain/repositories/mm.repository';
import { PpReleasedListener } from './infrastructure/event-handlers/pp-released.listener';
import { SupplierQualityFailListener } from './infrastructure/event-handlers/supplier-quality-fail.listener';
import { PoRequiresDirectorApprovalListener } from './infrastructure/event-handlers/po-requires-director-approval.listener';
import { PurchaseService } from './purchase/purchase.service';
import { DrizzlePurchaseSvcRepository } from './purchase/drizzle-purchase-svc.repo';
import { PURCHASE_SVC_REPO } from './purchase/i-purchase-svc.repo';
import { MaterialsService } from './materials/materials.service';
import { MmGoodsService } from './application/mm-goods.service';
import { DrizzleMmGoodsRepository } from './infrastructure/repositories/drizzle-mm-goods.repo';
import { MmVendorsPrService } from './application/mm-vendors-pr.service';
import { MmVendorsPrRepository } from './infrastructure/repositories/mm-vendors-pr.repository';
import { MM_VENDORS_PR_REPO } from './domain/repositories/i-mm-vendors-pr.repo';
import { DrizzleMaterialsSvcRepository } from './materials/drizzle-materials-svc.repo';
import { MATERIALS_SVC_REPO } from './materials/i-materials-svc.repo';

const commandHandlers = [
  CreatePurchaseOrderHandler,
  ApprovePurchaseOrderHandler,
  GoodsReceiptHandler,
  CreateMaterialHandler,
  UpdateMaterialHandler,
];

const queryHandlers = [GetPurchaseOrdersHandler, GetVendorsHandler, GetMaterialsHandler];

const listeners = [PpReleasedListener, SupplierQualityFailListener, PoRequiresDirectorApprovalListener];

const repositories = [
  { provide: MM_REPO, useClass: DrizzleMmRepository },
  { provide: MM_MATERIAL_REPO, useClass: DrizzleMaterialRepository },
  { provide: PURCHASE_SVC_REPO, useClass: DrizzlePurchaseSvcRepository },
  { provide: MATERIALS_SVC_REPO, useClass: DrizzleMaterialsSvcRepository },
];

@Module({
  imports: [AuthModule, CqrsModule, EventEmitterModule.forRoot()],
  controllers: [MmMaterialsController, MmPurchaseOrdersController, MmVendorsPrController, MmGoodsController, MmRawMaterialsController, MmMaterialCardsController, MmDashboardController],
  providers: [...commandHandlers, ...queryHandlers, ...listeners, ...repositories, PurchaseService, MaterialsService, DrizzleMmGoodsRepository, MmGoodsService,
    MmVendorsPrRepository,
    { provide: MM_VENDORS_PR_REPO, useClass: MmVendorsPrRepository },
    MmVendorsPrService,
    MmMaterialsExtrasRepository,
    { provide: MM_MATERIALS_EXTRAS_REPO, useClass: MmMaterialsExtrasRepository },
    MmMaterialsExtrasService,
    MmDashboardRepository,
    { provide: MM_DASHBOARD_REPO, useClass: MmDashboardRepository },
    MmDashboardService],
  exports: [MM_REPO, MM_MATERIAL_REPO, PURCHASE_SVC_REPO, MATERIALS_SVC_REPO, PurchaseService, MaterialsService],
})
export class MmModule {}
