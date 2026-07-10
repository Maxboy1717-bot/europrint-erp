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
import { HitlApprovalsController } from './presentation/hitl-approvals.controller';
import { HitlApprovalsRepository } from './infrastructure/repositories/hitl-approvals.repository';
import { HITL_APPROVALS_REPO } from './domain/repositories/i-hitl-approvals.repo';
import { MmMaterialsExtrasService } from './application/mm-materials-extras.service';
import { LayerFormulaService } from './application/layer-formula.service';
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
import { PoRequiresDirectorApprovalListener } from './infrastructure/event-handlers/po-requires-director-approval.listener';
import { ThreeWayMatchFailedListener } from './infrastructure/event-handlers/three-way-match-failed.listener';
import { OrderMaterialWaitingListener } from './infrastructure/event-handlers/order-material-waiting.listener';
import { PurchaseService } from './purchase/purchase.service';
import { DrizzlePurchaseSvcRepository } from './purchase/drizzle-purchase-svc.repo';
import { PURCHASE_SVC_REPO } from './purchase/i-purchase-svc.repo';
import { MmGoodsService } from './application/mm-goods.service';
import { DrizzleMmGoodsRepository } from './infrastructure/repositories/drizzle-mm-goods.repo';
import { MmVendorsPrService } from './application/mm-vendors-pr.service';
import { MmVendorsPrRepository } from './infrastructure/repositories/mm-vendors-pr.repository';
import { MM_VENDORS_PR_REPO } from './domain/repositories/i-mm-vendors-pr.repo';
import { MmVendorRatingService } from './application/mm-vendor-rating.service';
import { MmPriceVarianceService } from './application/mm-price-variance.service';
import { MmReconciliationController } from './presentation/mm-reconciliation.controller';
import { MmReconciliationService } from './application/mm-reconciliation.service';
import { MmReconciliationPdfService } from './application/mm-reconciliation-pdf.service';
import { MmReconciliationRepository } from './infrastructure/repositories/mm-reconciliation.repository';
import { MM_RECONCILIATION_REPO } from './domain/repositories/i-mm-reconciliation.repo';
import { MmReconciliationDigestCron } from './infrastructure/cron/mm-reconciliation-digest.cron';

const commandHandlers = [
  CreatePurchaseOrderHandler,
  ApprovePurchaseOrderHandler,
  GoodsReceiptHandler,
  CreateMaterialHandler,
  UpdateMaterialHandler,
];

const queryHandlers = [GetPurchaseOrdersHandler, GetVendorsHandler, GetMaterialsHandler];

const listeners = [PpReleasedListener, PoRequiresDirectorApprovalListener, ThreeWayMatchFailedListener, OrderMaterialWaitingListener];

const repositories = [
  { provide: MM_REPO, useClass: DrizzleMmRepository },
  { provide: MM_MATERIAL_REPO, useClass: DrizzleMaterialRepository },
  { provide: PURCHASE_SVC_REPO, useClass: DrizzlePurchaseSvcRepository },
  { provide: HITL_APPROVALS_REPO, useClass: HitlApprovalsRepository },
];

@Module({
  imports: [AuthModule, CqrsModule, EventEmitterModule.forRoot()],
  controllers: [MmMaterialsController, MmPurchaseOrdersController, MmVendorsPrController, MmGoodsController, MmRawMaterialsController, MmMaterialCardsController, MmDashboardController, HitlApprovalsController, MmReconciliationController],
  providers: [...commandHandlers, ...queryHandlers, ...listeners, ...repositories, PurchaseService, DrizzleMmGoodsRepository, MmGoodsService,
    MmVendorsPrRepository,
    { provide: MM_VENDORS_PR_REPO, useClass: MmVendorsPrRepository },
    MmVendorsPrService,
    MmMaterialsExtrasRepository,
    { provide: MM_MATERIALS_EXTRAS_REPO, useClass: MmMaterialsExtrasRepository },
    MmMaterialsExtrasService,
    MmDashboardRepository,
    { provide: MM_DASHBOARD_REPO, useClass: MmDashboardRepository },
    MmDashboardService,
    MmVendorRatingService,
    MmPriceVarianceService,
    MmReconciliationRepository,
    { provide: MM_RECONCILIATION_REPO, useClass: MmReconciliationRepository },
    MmReconciliationService,
    MmReconciliationPdfService,
    MmReconciliationDigestCron,
    LayerFormulaService],
  exports: [MM_REPO, MM_MATERIAL_REPO, PURCHASE_SVC_REPO, PurchaseService, LayerFormulaService],
})
export class MmModule {}
