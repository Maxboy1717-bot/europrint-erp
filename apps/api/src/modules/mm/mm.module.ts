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
import { MmMaterialsExtrasRepository } from './application/mm-materials-extras.repository';
import { MmDashboardService } from './application/mm-dashboard.service';
import { MmDashboardRepository } from './application/mm-dashboard.repository';
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
import { PpReleasedListener } from './infrastructure/event-handlers/pp-released.listener';
import { SupplierQualityFailListener } from './infrastructure/event-handlers/supplier-quality-fail.listener';
import { PurchaseService } from './purchase/purchase.service';
import { DrizzlePurchaseSvcRepository } from './purchase/drizzle-purchase-svc.repo';
import { PURCHASE_SVC_REPO } from './purchase/i-purchase-svc.repo';
import { MaterialsService } from './materials/materials.service';
import { MmGoodsService } from './application/mm-goods.service';
import { DrizzleMmGoodsRepository } from './infrastructure/repositories/drizzle-mm-goods.repo';
import { MmVendorsPrService } from './application/mm-vendors-pr.service';
import { MmVendorsPrRepository } from './application/mm-vendors-pr.repository';
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

const listeners = [PpReleasedListener, SupplierQualityFailListener];

const repositories = [
  { provide: 'IMmRepository', useClass: DrizzleMmRepository },
  { provide: 'IMmMaterialRepository', useClass: DrizzleMaterialRepository },
  { provide: PURCHASE_SVC_REPO, useClass: DrizzlePurchaseSvcRepository },
  { provide: MATERIALS_SVC_REPO, useClass: DrizzleMaterialsSvcRepository },
];

@Module({
  imports: [AuthModule, CqrsModule, EventEmitterModule.forRoot()],
  controllers: [MmMaterialsController, MmPurchaseOrdersController, MmVendorsPrController, MmGoodsController, MmRawMaterialsController, MmMaterialCardsController, MmDashboardController],
  providers: [...commandHandlers, ...queryHandlers, ...listeners, ...repositories, PurchaseService, MaterialsService, DrizzleMmGoodsRepository, MmGoodsService, MmVendorsPrRepository, MmVendorsPrService, MmMaterialsExtrasRepository, MmMaterialsExtrasService, MmDashboardRepository, MmDashboardService],
  exports: ['IMmRepository', 'IMmMaterialRepository', PURCHASE_SVC_REPO, MATERIALS_SVC_REPO, PurchaseService, MaterialsService],
})
export class MmModule {}
