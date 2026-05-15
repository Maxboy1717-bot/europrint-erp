/**
 * @module pos.module-imports
 * @description Re-exports of all symbols consumed by PosModule. Split from pos.module.ts
 * so the @Module() definition stays under 300 lines without breaking any external imports.
 */

export { PosGateway } from './pos.gateway';

// Controllers
export { PosStubController }        from './controllers/pos-stub.controller';
export { CashRegisterController }   from './controllers/cash-register.controller';
export { PosPrinterConfigV2Controller } from './controllers/pos-printer-config-v2.controller';
export { MovementsController }      from './controllers/movements.controller';
export { BarcodeController }        from './controllers/barcode.controller';
export { RequestsController }       from './controllers/requests.controller';
export { InventoryCountController } from './controllers/inventory-count.controller';
export { EmployeeController }       from './controllers/employee.controller';
export { ReportsController }        from './controllers/reports.controller';
export { MiniAppController }        from './controllers/mini-app.controller';
export { MiniAppHistoryController } from './controllers/mini-app-history.controller';
export { PrinterConfigController }  from './controllers/printer-config.controller';
export { StockController }          from './controllers/stock.controller';
export { GlController }             from './controllers/gl.controller';
export { SyncController }           from './controllers/sync.controller';
export { PosNotificationsController } from './controllers/pos-notifications.controller';
export { PosAuthController } from './controllers/pos-auth.controller';
export { InventoryPassportController }    from './controllers/inventory-passport.controller';
export { PosInventoryPassportRepository } from './pos-inventory-passport.repository';
export { PosInventoryPassportService }    from './pos-inventory-passport.service';
export { PosFifoService }                 from './services/pos-fifo.service';
export { PosLowStockJob }                 from './jobs/pos-low-stock.job';
export { PosQuarantineCheckJob }          from './jobs/pos-quarantine-check.job';
export { PosFifoRecalculateJob }          from './jobs/pos-fifo-recalculate.job';
export { PosInactiveMaterialsJob }        from './jobs/pos-inactive-materials.job';

// Retail POS
export { CashRegisterService }      from './services/cash-register.service';
export { CashRegisterRepository }   from './repositories/cash-register.repository';
export { PosAuthService }           from './services/pos-auth.service';
export { PosAuthRepository }        from './repositories/pos-auth.repository';

// Services
export { PosMovementService }        from './services/pos-movement.service';
export { PosMovementRepository }    from './services/pos-movement.repository';
export { PosMovementStatusService }  from './services/pos-movement-status.service';
export { PosMovementStatusRepository } from './services/pos-movement-status.repository';
export { PosMovementQueryService }   from './services/pos-movement-query.service';
export { PosBarcodeService }        from './services/pos-barcode.service';
export { PosBarcodeRepository }    from './pos-barcode.repository';
export { PosBarcodeExtService }    from './services/pos-barcode-ext.service';
export { PosBarcodeExtRepository } from './pos-barcode-ext.repository';
export { PosInventoryCountQueryService } from './services/pos-inventory-count-query.service';
export { PosInventoryCountQueryRepository } from './repositories/pos-inventory-count-query.repository';
export { PosRequestService }        from './services/pos-request.service';
export { PosRequestRepository }    from './pos-request.repository';
export { PosRequestExtService }    from './services/pos-request-ext.service';
export { PosRequestExtRepository } from './pos-request-ext.repository';
export { PosInventoryCountService } from './services/pos-inventory-count.service';
export { PosInventoryCountRepository } from './pos-inventory-count.repository';
export { PosAuditService }          from './services/pos-audit.service';
export { PosAuditRepository }       from './services/pos-audit.repository';
export { PosMovementQueryRepository } from './services/pos-movement-query.repository';
export { LabelRepository }          from './services/label.repository';
export { PosPrinterConfigRepository } from './services/pos-printer-config.repository';
export { PosTelegramService }       from './services/pos-telegram.service';
export { PosTelegramRepository }   from './pos-telegram.repository';
export { PosTelegramExtService }   from './services/pos-telegram-ext.service';
export { PosTelegramExtRepository } from './pos-telegram-ext.repository';
export { PosPdfService }            from './services/pos-pdf.service';
export { PosPdfRepository }        from './pos-pdf.repository';
export { PosPdfInventoryService }   from './services/pos-pdf-inventory.service';
export { PosPdfInventoryRepository } from './pos-pdf-inventory.repository';
export { LabelService }             from './services/label.service';
export { LabelExtService }         from './services/label-ext.service';
export { PosMiniAppService }       from './services/pos-mini-app.service';
export { PosMiniAppRepository }   from './repositories/pos-mini-app.repository';
export { PosPrinterConfigService } from './services/pos-printer-config.service';
export { PosReportsService }       from './services/pos-reports.service';
export { PosReportsRepository }   from './repositories/pos-reports.repository';

// New v3 services
export { StockLedgerService }       from './services/stock-ledger.service';
export { GlPostingLogService }      from './services/gl-posting-log.service';
export { PosGlAutoService }         from './services/pos-gl-auto.service';
export { PosBalanceGuardService }   from './services/pos-balance-guard.service';
export { PosSyncService }           from './services/pos-sync.service';
export { PosNotificationsService }  from './services/pos-notifications.service';

// New v3 repositories
export { StockLedgerRepository }    from './repositories/stock-ledger.repository';
export { GlPostingLogRepository }   from './repositories/gl-posting-log.repository';
export { PosSyncRepository }        from './repositories/pos-sync.repository';
export { PosNotificationsRepository } from './repositories/pos-notifications.repository';

// Helper services
export { LifecycleBlockService }    from './lifecycle-block.service';
export { PosLifecycleBlockRepository } from './pos-lifecycle-block.repository';
export { StockReservationService }  from './stock-reservation.service';
export { PosStockReservationRepository } from './pos-stock-reservation.repository';
export { EmployeeLedgerService }    from './employee-ledger.service';
export { EmployeeLedgerRepository } from './employee-ledger.repository';
export { EmployeeWriteOffService }     from './employee-write-off.service';
export { EmployeeWriteOffRepository }  from './employee-write-off.repository';

// Inventory service with repository pattern
export { PosInventoryService } from './pos-inventory.service';
export { PosInventoryRepository } from './repositories/pos-inventory.repository';

// Legacy POS service with repository pattern
export { PosService } from './pos.service';
export { DrizzlePosSvcRepository } from './pos-svc/drizzle-pos-svc.repo';
export { POS_SVC_REPO } from './pos-svc/i-pos-svc.repo';

// Events & Guards
export { PosEventHandler }         from './events/pos.events';
export { PosSecondaryEventsHandler } from './events/pos-secondary-events.handler';
export { PosEventRepository }      from './repositories/pos-event.repository';
export { PosDepartmentGuard }      from './guards/pos-department.guard';

// New workflow & balance services
export { PosRequisitionWorkflowService } from './services/pos-requisition-workflow.service';
export { PosEmployeeBalanceService }     from './services/pos-employee-balance.service';

// WMS integration
export { PosWmsSyncService }  from './services/pos-wms-sync.service';
export { PosWmsQueryService } from './services/pos-wms-query.service';
export { PosWmsController }   from './controllers/pos-wms.controller';

// Warehouse features (xodimlar, auto-barcode, material 360, GL, KPI, GRN)
export { WarehouseEmployeesService }    from './services/warehouse-employees.service';
export { AutoBarcodeService }           from './services/auto-barcode.service';
export { Material360Service }           from './services/material-360.service';
export { AutoGlPostingService }         from './services/auto-gl-posting.service';
export { WarehouseKpiService }          from './services/warehouse-kpi.service';
export { GoodsReceiptService }          from './services/goods-receipt.service';
export { QuarantineWorkflowService }    from './services/quarantine-workflow.service';
export { ThreeWayMatchService }         from './services/three-way-match.service';
export { SmsService }                   from './services/sms.service';
export { EmailService }                 from './services/email.service';
export { TelegramBotService }           from './services/telegram-bot.service';
export { QueueService }                 from './services/queue.service';
export { WarehouseFeaturesController }  from './controllers/warehouse-features.controller';

// Sprint B: new repositories for warehouse feature services
export { WarehouseEmployeesRepository }  from './repositories/warehouse-employees.repository';
export { GoodsReceiptRepository }        from './repositories/goods-receipt.repository';
export { AutoBarcodeRepository }         from './repositories/auto-barcode.repository';
export { WarehouseKpiRepository }        from './repositories/warehouse-kpi.repository';
export { QuarantineWorkflowRepository }  from './repositories/quarantine-workflow.repository';
export { ThreeWayMatchRepository }       from './repositories/three-way-match.repository';
export { AutoGlPostingRepository }       from './repositories/auto-gl-posting.repository';
export { PosEmployeeBalanceRepository }  from './repositories/pos-employee-balance.repository';
