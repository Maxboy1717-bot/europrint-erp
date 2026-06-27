/**
 * @module pos.module-imports
 * @description Re-exports of all symbols consumed by PosModule. Split from pos.module.ts
 * so the @Module() definition stays under 300 lines without breaking any external imports.
 */

export { PosGateway } from './presentation/pos.gateway';

// Controllers
export { PosStubController }        from './presentation/pos-stub.controller';
export { CashRegisterController }   from './presentation/cash-register.controller';
export { PosPrinterConfigV2Controller } from './presentation/pos-printer-config-v2.controller';
export { MovementsController }      from './presentation/movements.controller';
export { ShiftHandoverController }   from './presentation/shift-handover.controller';
export { PosShiftHandoverService }    from './application/services/pos-shift-handover.service';
export { PosShiftHandoverRepository } from './infrastructure/repositories/pos-shift-handover.repository';
export { BarcodeController }        from './presentation/barcode.controller';
export { RequestsController }       from './presentation/requests.controller';
export { InventoryCountController } from './presentation/inventory-count.controller';
export { EmployeeController }       from './presentation/employee.controller';
export { ReportsController }        from './presentation/reports.controller';
export { MiniAppController }        from './presentation/mini-app.controller';
export { MiniAppHistoryController } from './presentation/mini-app-history.controller';
export { PrinterConfigController }  from './presentation/printer-config.controller';
export { StockController }          from './presentation/stock.controller';
export { GlController }             from './presentation/gl.controller';
export { SyncController }           from './presentation/sync.controller';
export { PosNotificationsController } from './presentation/pos-notifications.controller';
export { PosAuthController } from './presentation/pos-auth.controller';
export { InventoryPassportController }    from './presentation/inventory-passport.controller';
export { PosInventoryPassportRepository } from './infrastructure/repositories/pos-inventory-passport.repository';
export { PosInventoryPassportService }    from './application/services/pos-inventory-passport.service';
export { PosFifoService }                 from './application/services/pos-fifo.service';
export { PosLowStockJob }                 from './application/jobs/pos-low-stock.job';
export { PosQuarantineCheckJob }          from './application/jobs/pos-quarantine-check.job';
export { PosFifoRecalculateJob }          from './application/jobs/pos-fifo-recalculate.job';
export { PosInactiveMaterialsJob }        from './application/jobs/pos-inactive-materials.job';

// Retail POS
export { CashRegisterService }      from './application/services/cash-register.service';
export { CashRegisterRepository }   from './infrastructure/repositories/cash-register.repository';
export { PosAuthService }           from './application/services/pos-auth.service';
export { PosAuthRepository }        from './infrastructure/repositories/pos-auth.repository';

// Services
export { PosMovementService }        from './application/services/pos-movement.service';
export { PosMovementRepository }    from './infrastructure/repositories/pos-movement.repository';
export { PosMovementStatusService }  from './application/services/pos-movement-status.service';
export { PosMovementStatusRepository } from './infrastructure/repositories/pos-movement-status.repository';
export { PosMovementQueryService }   from './application/services/pos-movement-query.service';
export { PosBarcodeService }        from './application/services/pos-barcode.service';
export { PosBarcodeRepository }    from './infrastructure/repositories/pos-barcode.repository';
export { PosBarcodeExtService }    from './application/services/pos-barcode-ext.service';
export { PosBarcodeExtRepository } from './infrastructure/repositories/pos-barcode-ext.repository';
export { PosInventoryCountQueryService } from './application/services/pos-inventory-count-query.service';
export { PosInventoryCountQueryRepository } from './infrastructure/repositories/pos-inventory-count-query.repository';
export { PosRequestService }        from './application/services/pos-request.service';
export { PosRequestRepository }    from './infrastructure/repositories/pos-request.repository';
export { PosRequestExtService }    from './application/services/pos-request-ext.service';
export { PosRequestExtRepository } from './infrastructure/repositories/pos-request-ext.repository';
export { PosInventoryCountService } from './application/services/pos-inventory-count.service';
export { PosInventoryCountRepository } from './infrastructure/repositories/pos-inventory-count.repository';
export { PosAuditService }          from './application/services/pos-audit.service';
export { PosAuditRepository }       from './infrastructure/repositories/pos-audit.repository';
export { PosMovementQueryRepository } from './infrastructure/repositories/pos-movement-query.repository';
export { LabelRepository }          from './infrastructure/repositories/label.repository';
export { PosPrinterConfigRepository } from './infrastructure/repositories/pos-printer-config.repository';
export { PosTelegramService }       from './application/services/pos-telegram.service';
export { PosTelegramRepository }   from './infrastructure/repositories/pos-telegram.repository';
export { PosTelegramExtService }   from './application/services/pos-telegram-ext.service';
export { PosTelegramExtRepository } from './infrastructure/repositories/pos-telegram-ext.repository';
export { PosPdfService }            from './application/services/pos-pdf.service';
export { PosPdfRepository }        from './infrastructure/repositories/pos-pdf.repository';
export { PosPdfInventoryService }   from './application/services/pos-pdf-inventory.service';
export { PosPdfInventoryRepository } from './infrastructure/repositories/pos-pdf-inventory.repository';
export { LabelService }             from './application/services/label.service';
export { LabelExtService }         from './application/services/label-ext.service';
export { PosMiniAppService }       from './application/services/pos-mini-app.service';
export { PosMiniAppRepository }   from './infrastructure/repositories/pos-mini-app.repository';
export { PosPrinterConfigService } from './application/services/pos-printer-config.service';
export { PosReportsService }       from './application/services/pos-reports.service';
export { PosReportsRepository }   from './infrastructure/repositories/pos-reports.repository';

// New v3 services
export { StockLedgerService }       from './application/services/stock-ledger.service';
export { GlPostingLogService }      from './application/services/gl-posting-log.service';
export { PosGlAutoService }         from './application/services/pos-gl-auto.service';
export { PosBalanceGuardService }   from './application/services/pos-balance-guard.service';
export { PosSyncService }           from './application/services/pos-sync.service';
export { PosNotificationsService }  from './application/services/pos-notifications.service';

// New v3 repositories
export { StockLedgerRepository }    from './infrastructure/repositories/stock-ledger.repository';
export { GlPostingLogRepository }   from './infrastructure/repositories/gl-posting-log.repository';
export { PosSyncRepository }        from './infrastructure/repositories/pos-sync.repository';
export { PosNotificationsRepository } from './infrastructure/repositories/pos-notifications.repository';

// Helper services
export { LifecycleBlockService }    from './application/services/lifecycle-block.service';
export { PosLifecycleBlockRepository } from './infrastructure/repositories/pos-lifecycle-block.repository';
export { StockReservationService }  from './application/services/stock-reservation.service';
export { PosStockReservationRepository } from './infrastructure/repositories/pos-stock-reservation.repository';
export { EmployeeLedgerService }    from './application/services/employee-ledger.service';
export { EmployeeLedgerRepository } from './infrastructure/repositories/employee-ledger.repository';
export { EmployeeWriteOffService }     from './application/services/employee-write-off.service';
export { EmployeeWriteOffRepository }  from './infrastructure/repositories/employee-write-off.repository';

// Inventory service with repository pattern
export { PosInventoryService } from './application/services/pos-inventory.service';
export { PosInventoryRepository } from './infrastructure/repositories/pos-inventory.repository';

// Legacy POS service with repository pattern
export { PosService } from './application/services/pos.service';
export { DrizzlePosSvcRepository } from './infrastructure/repositories/drizzle-pos-svc.repo';
export { POS_SVC_REPO } from './domain/repositories/i-pos-svc.repo';

// Events & Guards
export { PosEventHandler }         from './application/event-handlers/pos.events';
export { PosSecondaryEventsHandler } from './application/event-handlers/pos-secondary-events.handler';
export { PosEventRepository }      from './infrastructure/repositories/pos-event.repository';
export { PosDepartmentGuard }      from './presentation/guards/pos-department.guard';
// Wave 4 round-4 — canonical CQRS event handler (completed listener removed 2026-06-06: dead duplicate)
export { PosWmsSyncCreatedListener }   from './application/event-handlers/pos-wms-sync-created.listener';
// P2-ANOMALY — qoida-asosli anomaliya aniqlash (movement-completed/cancelled listener)
export { PosAnomalyService }    from './application/services/pos-anomaly.service';
export { PosAnomalyRepository } from './infrastructure/repositories/pos-anomaly.repository';
export { PosAnomalyListener }   from './application/event-handlers/pos-anomaly.listener';

// New workflow & balance services
export { PosRequisitionWorkflowService } from './application/services/pos-requisition-workflow.service';
export { PosEmployeeBalanceService }     from './application/services/pos-employee-balance.service';

// WMS integration
export { PosWmsSyncService }  from './application/services/pos-wms-sync.service';
export { PosWmsQueryService } from './application/services/pos-wms-query.service';
export { PosWmsController }   from './presentation/pos-wms.controller';

// Warehouse features (xodimlar, auto-barcode, material 360, GL, KPI, GRN)
export { WarehouseEmployeesService }    from './application/services/warehouse-employees.service';
export { AutoBarcodeService }           from './application/services/auto-barcode.service';
export { Material360Service }           from './application/services/material-360.service';
export { AutoGlPostingService }         from './application/services/auto-gl-posting.service';
export { WarehouseKpiService }          from './application/services/warehouse-kpi.service';
export { GoodsReceiptService }          from './application/services/goods-receipt.service';
export { QuarantineWorkflowService }    from './application/services/quarantine-workflow.service';
export { ThreeWayMatchService }         from './application/services/three-way-match.service';
export { SmsService }                   from './application/services/sms.service';
export { EmailService }                 from './application/services/email.service';
export { TelegramBotService }           from './application/services/telegram-bot.service';
export { QueueService }                 from './application/services/queue.service';
export { WarehouseFeaturesController }  from './presentation/warehouse-features.controller';
export { PosOperationsController }      from './presentation/pos-operations.controller';

// Sprint B: new repositories for warehouse feature services
export { WarehouseEmployeesRepository }  from './infrastructure/repositories/warehouse-employees.repository';
export { GoodsReceiptRepository }        from './infrastructure/repositories/goods-receipt.repository';
export { AutoBarcodeRepository }         from './infrastructure/repositories/auto-barcode.repository';
export { WarehouseKpiRepository }        from './infrastructure/repositories/warehouse-kpi.repository';
export { QuarantineWorkflowRepository }  from './infrastructure/repositories/quarantine-workflow.repository';
export { ThreeWayMatchRepository }       from './infrastructure/repositories/three-way-match.repository';
export { AutoGlPostingRepository }       from './infrastructure/repositories/auto-gl-posting.repository';
export { PosEmployeeBalanceRepository }  from './infrastructure/repositories/pos-employee-balance.repository';