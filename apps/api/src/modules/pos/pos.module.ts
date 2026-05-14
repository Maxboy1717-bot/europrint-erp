/**
 * @module pos.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { PosGateway } from './pos.gateway';

// Controllers
import { PosStubController }        from './controllers/pos-stub.controller';
import { CashRegisterController }   from './controllers/cash-register.controller';
import { PosPrinterConfigV2Controller } from './controllers/pos-printer-config-v2.controller';
import { MovementsController }      from './controllers/movements.controller';
import { BarcodeController }        from './controllers/barcode.controller';
import { RequestsController }       from './controllers/requests.controller';
import { InventoryCountController } from './controllers/inventory-count.controller';
import { EmployeeController }       from './controllers/employee.controller';
import { ReportsController }        from './controllers/reports.controller';
import { MiniAppController }        from './controllers/mini-app.controller';
import { MiniAppHistoryController } from './controllers/mini-app-history.controller';
import { PrinterConfigController }  from './controllers/printer-config.controller';
import { StockController }          from './controllers/stock.controller';
import { GlController }             from './controllers/gl.controller';
import { SyncController }           from './controllers/sync.controller';
import { PosNotificationsController } from './controllers/pos-notifications.controller';
import { PosAuthController } from './controllers/pos-auth.controller';
import { InventoryPassportController }    from './controllers/inventory-passport.controller';
import { PosInventoryPassportRepository } from './pos-inventory-passport.repository';
import { PosInventoryPassportService }    from './pos-inventory-passport.service';
import { PosFifoService }                 from './services/pos-fifo.service';
import { PosLowStockJob }                 from './jobs/pos-low-stock.job';
import { PosQuarantineCheckJob }          from './jobs/pos-quarantine-check.job';
import { PosFifoRecalculateJob }          from './jobs/pos-fifo-recalculate.job';
import { PosInactiveMaterialsJob }        from './jobs/pos-inactive-materials.job';

// Retail POS
import { CashRegisterService }      from './services/cash-register.service';
import { CashRegisterRepository }   from './repositories/cash-register.repository';
import { PosAuthService }           from './services/pos-auth.service';
import { PosAuthRepository }        from './repositories/pos-auth.repository';

// Services
import { PosMovementService }        from './services/pos-movement.service';
import { PosMovementRepository }    from './services/pos-movement.repository';
import { PosMovementStatusService }  from './services/pos-movement-status.service';
import { PosMovementStatusRepository } from './services/pos-movement-status.repository';
import { PosMovementQueryService }   from './services/pos-movement-query.service';
import { PosBarcodeService }        from './services/pos-barcode.service';
import { PosBarcodeRepository }    from './pos-barcode.repository';
import { PosBarcodeExtService }    from './services/pos-barcode-ext.service';
import { PosBarcodeExtRepository } from './pos-barcode-ext.repository';
import { PosInventoryCountQueryService } from './services/pos-inventory-count-query.service';
import { PosInventoryCountQueryRepository } from './repositories/pos-inventory-count-query.repository';
import { PosRequestService }        from './services/pos-request.service';
import { PosRequestRepository }    from './pos-request.repository';
import { PosRequestExtService }    from './services/pos-request-ext.service';
import { PosRequestExtRepository } from './pos-request-ext.repository';
import { PosInventoryCountService } from './services/pos-inventory-count.service';
import { PosInventoryCountRepository } from './pos-inventory-count.repository';
import { PosAuditService }          from './services/pos-audit.service';
import { PosAuditRepository }       from './services/pos-audit.repository';
import { PosMovementQueryRepository } from './services/pos-movement-query.repository';
import { LabelRepository }          from './services/label.repository';
import { PosPrinterConfigRepository } from './services/pos-printer-config.repository';
import { PosTelegramService }       from './services/pos-telegram.service';
import { PosTelegramRepository }   from './pos-telegram.repository';
import { PosTelegramExtService }   from './services/pos-telegram-ext.service';
import { PosTelegramExtRepository } from './pos-telegram-ext.repository';
import { PosPdfService }            from './services/pos-pdf.service';
import { PosPdfRepository }        from './pos-pdf.repository';
import { PosPdfInventoryService }   from './services/pos-pdf-inventory.service';
import { PosPdfInventoryRepository } from './pos-pdf-inventory.repository';
import { LabelService }             from './services/label.service';
import { LabelExtService }         from './services/label-ext.service';
import { PosMiniAppService }       from './services/pos-mini-app.service';
import { PosMiniAppRepository }   from './repositories/pos-mini-app.repository';
import { PosPrinterConfigService } from './services/pos-printer-config.service';
import { PosReportsService }       from './services/pos-reports.service';
import { PosReportsRepository }   from './repositories/pos-reports.repository';

// New v3 services
import { StockLedgerService }       from './services/stock-ledger.service';
import { GlPostingLogService }      from './services/gl-posting-log.service';
import { PosGlAutoService }         from './services/pos-gl-auto.service';
import { PosBalanceGuardService }   from './services/pos-balance-guard.service';
import { PosSyncService }           from './services/pos-sync.service';
import { PosNotificationsService }  from './services/pos-notifications.service';

// New v3 repositories
import { StockLedgerRepository }    from './repositories/stock-ledger.repository';
import { GlPostingLogRepository }   from './repositories/gl-posting-log.repository';
import { PosSyncRepository }        from './repositories/pos-sync.repository';
import { PosNotificationsRepository } from './repositories/pos-notifications.repository';

// Helper services
import { LifecycleBlockService }    from './lifecycle-block.service';
import { PosLifecycleBlockRepository } from './pos-lifecycle-block.repository';
import { StockReservationService }  from './stock-reservation.service';
import { PosStockReservationRepository } from './pos-stock-reservation.repository';
import { EmployeeLedgerService }    from './employee-ledger.service';
import { EmployeeLedgerRepository } from './employee-ledger.repository';
import { EmployeeWriteOffService }     from './employee-write-off.service';
import { EmployeeWriteOffRepository }  from './employee-write-off.repository';

// Inventory service with repository pattern
import { PosInventoryService } from './pos-inventory.service';
import { PosInventoryRepository } from './repositories/pos-inventory.repository';

// Legacy POS service with repository pattern
import { PosService } from './pos.service';
import { DrizzlePosSvcRepository } from './pos-svc/drizzle-pos-svc.repo';
import { POS_SVC_REPO } from './pos-svc/i-pos-svc.repo';

// Events & Guards
import { PosEventHandler }         from './events/pos.events';
import { PosEventRepository }      from './repositories/pos-event.repository';
import { PosDepartmentGuard }      from './guards/pos-department.guard';

// New workflow & balance services
import { PosRequisitionWorkflowService } from './services/pos-requisition-workflow.service';
import { PosEmployeeBalanceService }     from './services/pos-employee-balance.service';

// WMS integration
import { PosWmsSyncService }  from './services/pos-wms-sync.service';
import { PosWmsQueryService } from './services/pos-wms-query.service';
import { PosWmsController }   from './controllers/pos-wms.controller';

// Warehouse features (xodimlar, auto-barcode, material 360, GL, KPI, GRN)
import { WarehouseEmployeesService }    from './services/warehouse-employees.service';
import { AutoBarcodeService }           from './services/auto-barcode.service';
import { Material360Service }           from './services/material-360.service';
import { AutoGlPostingService }         from './services/auto-gl-posting.service';
import { WarehouseKpiService }          from './services/warehouse-kpi.service';
import { GoodsReceiptService }          from './services/goods-receipt.service';
import { QuarantineWorkflowService }    from './services/quarantine-workflow.service';
import { ThreeWayMatchService }         from './services/three-way-match.service';
import { SmsService }                   from './services/sms.service';
import { EmailService }                 from './services/email.service';
import { TelegramBotService }           from './services/telegram-bot.service';
import { QueueService }                 from './services/queue.service';
import { WarehouseFeaturesController }  from './controllers/warehouse-features.controller';

// Sprint B: new repositories for warehouse feature services
import { WarehouseEmployeesRepository }  from './repositories/warehouse-employees.repository';
import { GoodsReceiptRepository }        from './repositories/goods-receipt.repository';
import { AutoBarcodeRepository }         from './repositories/auto-barcode.repository';
import { WarehouseKpiRepository }        from './repositories/warehouse-kpi.repository';
import { QuarantineWorkflowRepository }  from './repositories/quarantine-workflow.repository';
import { ThreeWayMatchRepository }       from './repositories/three-way-match.repository';
import { AutoGlPostingRepository }       from './repositories/auto-gl-posting.repository';
import { PosEmployeeBalanceRepository }  from './repositories/pos-employee-balance.repository';

@Module({
  controllers: [
    PosStubController,
    CashRegisterController,
    PosPrinterConfigV2Controller,
    MovementsController,
    BarcodeController,
    RequestsController,
    InventoryCountController,
    EmployeeController,
    ReportsController,
    MiniAppController,
    MiniAppHistoryController,
    PrinterConfigController,
    StockController,
    GlController,
    SyncController,
    PosNotificationsController,
    PosAuthController,
    InventoryPassportController,
    PosWmsController,
    WarehouseFeaturesController,
  ],
  providers: [
    { provide: POS_SVC_REPO, useClass: DrizzlePosSvcRepository },
    CashRegisterRepository,
    CashRegisterService,
    PosService,
    PosMovementRepository,
    PosMovementService,
    PosMovementStatusRepository,
    PosMovementStatusService,
    PosMovementQueryService,
    PosBarcodeRepository,
    PosBarcodeService,
    PosBarcodeExtRepository,
    PosBarcodeExtService,
    PosRequestRepository,
    PosRequestService,
    PosRequestExtRepository,
    PosRequestExtService,
    PosInventoryCountRepository,
    PosInventoryCountService,
    PosInventoryCountQueryRepository,
    PosInventoryCountQueryService,
    PosAuditRepository,
    PosAuditService,
    PosAuthRepository,
    PosAuthService,
    PosMovementQueryRepository,
    PosTelegramRepository,
    PosTelegramService,
    PosTelegramExtRepository,
    PosTelegramExtService,
    PosPdfRepository,
    PosPdfService,
    PosPdfInventoryRepository,
    PosPdfInventoryService,
    LabelRepository,
    LabelService,
    LabelExtService,
    PosLifecycleBlockRepository,
    LifecycleBlockService,
    PosStockReservationRepository,
    StockReservationService,
    EmployeeLedgerRepository,
    EmployeeLedgerService,
    EmployeeWriteOffRepository,
    EmployeeWriteOffService,
    PosEventHandler,
    PosEventRepository,
    PosDepartmentGuard,
    PosMiniAppRepository,
    PosMiniAppService,
    PosPrinterConfigRepository,
    PosPrinterConfigService,
    PosReportsRepository,
    PosReportsService,
    PosInventoryService,
    PosInventoryRepository,
    StockLedgerRepository,
    StockLedgerService,
    GlPostingLogRepository,
    GlPostingLogService,
    PosGlAutoService,
    PosBalanceGuardService,
    PosSyncRepository,
    PosSyncService,
    PosNotificationsRepository,
    PosNotificationsService,
    PosGateway,
    PosInventoryPassportRepository,
    PosInventoryPassportService,
    PosFifoService,
    PosLowStockJob,
    PosQuarantineCheckJob,
    PosFifoRecalculateJob,
    PosRequisitionWorkflowService,
    PosEmployeeBalanceService,
    PosWmsSyncService,
    PosWmsQueryService,
    PosInactiveMaterialsJob,
    // Warehouse features — repositories (Sprint B)
    WarehouseEmployeesRepository,
    GoodsReceiptRepository,
    AutoBarcodeRepository,
    WarehouseKpiRepository,
    QuarantineWorkflowRepository,
    ThreeWayMatchRepository,
    AutoGlPostingRepository,
    PosEmployeeBalanceRepository,
    // Warehouse features — services
    WarehouseEmployeesService,
    AutoBarcodeService,
    Material360Service,
    AutoGlPostingService,
    WarehouseKpiService,
    GoodsReceiptService,
    QuarantineWorkflowService,
    ThreeWayMatchService,
    SmsService,
    EmailService,
    TelegramBotService,
    QueueService,
  ],
  exports: [
    POS_SVC_REPO,
    PosService,
    PosMovementService,
    PosMovementStatusService,
    PosMovementQueryService,
    PosBarcodeService,
    PosBarcodeExtService,
    PosRequestService,
    PosRequestExtService,
    PosInventoryCountService,
    PosInventoryCountQueryService,
    EmployeeLedgerService,
    StockReservationService,
    PosAuditService,
    PosPdfService,
    PosPdfInventoryService,
    LabelService,
    LabelExtService,
    StockLedgerService,
    GlPostingLogService,
    PosNotificationsService,
    PosInventoryPassportService,
    PosFifoService,
    PosRequisitionWorkflowService,
    PosEmployeeBalanceService,
  ],
})
export class PosModule {}
