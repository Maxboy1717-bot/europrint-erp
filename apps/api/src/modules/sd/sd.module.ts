/**
 * @module sd.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { SdKlisheRetentionController } from './presentation/sd-klishe-retention.controller';
import { KlisheRetentionService } from './application/klishe-retention.service';
import { KlisheRetentionCron } from './cron/klishe-retention.cron';
import { DrizzleKlisheRetentionRepository } from './infrastructure/repositories/drizzle-klishe-retention.repo';
import { KLISHE_RETENTION_REPO } from './domain/repositories/i-klishe-retention.repo';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FinanceModule } from '@modules/finance/finance.module'; // #04 EP-SD-030: GlPostingService for payment→entries
import { SdOrdersController } from './presentation/sd-orders.controller';
import { SdOrderDepartmentsController } from './presentation/sd-order-departments.controller';
import { SdOrderDepartmentsService } from './application/sd-order-departments.service';
import { SdOrderDepartmentsRepository } from './orders/drizzle-sd-order-departments.repo';
import { SdInvoicesController } from './presentation/sd-invoices.controller';
import { SdDeliveriesController } from './presentation/sd-deliveries.controller';
import { SdDashboardController } from './presentation/sd-dashboard.controller';
import { SdCustomersController } from './presentation/sd-customers.controller';
import { SdLeadsController } from './presentation/sd-leads.controller';
import { SdPaymentsController } from './presentation/sd-payments.controller';
import { SdQuotationsController } from './presentation/sd-quotations.controller';
import { SdContractsController } from './presentation/sd-contracts.controller';
import { SdContractTermsRepository } from './infrastructure/repositories/sd-contract-terms.repo';
import { SdPaymentsService } from './application/sd-payments.service';
import { SdPaymentsRepository } from './infrastructure/repositories/sd-payments.repository';
import { SD_PAYMENTS_REPO } from './domain/repositories/i-sd-payments.repo';
import { SdDashboardRepository } from './infrastructure/repositories/sd-dashboard.repository';
import { SD_DASHBOARD_REPO } from './domain/repositories/i-sd-dashboard.repo';
import { SdQuotationsService } from './application/sd-quotations.service';
import { SdQuotationsRepository } from './infrastructure/repositories/sd-quotations.repository';
import { SD_QUOTATIONS_REPO } from './domain/repositories/i-sd-quotations.repo';
import { CreateOrderHandler } from './application/commands/create-order.handler';
import { CreateTestOrderHandler } from './application/commands/create-test-order.handler';
import { UpdateOrderStatusHandler } from './application/commands/update-order-status.handler';
import { SignalPendingMaterialHandler } from './application/commands/signal-pending-material.handler';
import { ApproveAdvanceBypassHandler } from './application/commands/approve-advance-bypass.handler';
import { ApproveTechCheckpointHandler } from './application/commands/approve-tech-checkpoint.handler';
import { CreateInvoiceHandler } from './application/commands/create-invoice.handler';
import { ConfirmAdvancePaymentHandler } from './application/commands/confirm-advance-payment.handler';
import { ListOrdersHandler } from './application/queries/list-orders.handler';
import { GetOrderByIdHandler } from './application/queries/get-order-by-id.handler';
import { GetOrderItemsHandler } from './application/queries/get-order-items.handler';
import { AtpCheckHandler } from './application/queries/atp-check.handler';
import { DrizzleSdAtpRepository } from './infrastructure/repositories/drizzle-sd-atp.repo';
import { PendingAdvanceOrdersHandler } from './application/queries/pending-advance-orders.handler';
import { GetInvoicesHandler } from './application/queries/get-invoices.handler';
import { GetInvoiceHandler } from './application/queries/get-invoice.handler';
import { DrizzleSalesOrderRepository } from './infrastructure/repositories/drizzle-sales-order.repo';
import { SALES_ORDER_REPO } from './domain/repositories/i-sales-order.repo';
import { DealWonListener } from './infrastructure/event-handlers/deal-won.listener';
import { PaymentReceivedListener } from './infrastructure/event-handlers/payment-received.listener';
import { AdvanceApprovedFanoutListener } from './infrastructure/event-handlers/advance-approved-fanout.listener';
import { PpCancelledSdListener } from './infrastructure/event-handlers/pp-cancelled-sd.listener';
import { QcFailedSdListener } from './infrastructure/event-handlers/qc-failed-sd.listener';
import { PosExternalOutSdListener } from './infrastructure/event-handlers/pos-external-out-sd.listener';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { QcCustomerFaultSdListener } from './infrastructure/event-handlers/qc-customer-fault-sd.listener';
import { AutoInvoiceListener } from './infrastructure/event-handlers/auto-invoice.listener';
import { loggerProvider } from '../shared/infrastructure/logger.provider';
import { TashkentTimeService } from '@common/time';
import { SD_ORDERS_REPO } from './orders/i-sd-orders.repo';
import { DrizzleSdOrdersRepository } from './orders/drizzle-sd-orders.repo';
import { OrdersService } from './orders/orders.service';
import { SD_INVOICES_REPO } from './invoices/i-sd-invoices.repo';
import { DrizzleSdInvoicesRepository } from './invoices/drizzle-sd-invoices.repo';
import { SdInvoicePdfService } from './invoices/sd-invoice-pdf.service';
import { SdQuotationPdfService } from './invoices/sd-quotation-pdf.service';
import { SD_DELIVERIES_REPO } from './deliveries/i-sd-deliveries.repo';
import { DrizzleSdDeliveriesRepository } from './deliveries/drizzle-sd-deliveries.repo';
import { DeliveriesService } from './deliveries/deliveries.service';
import { SdDashboardService } from './application/sd-dashboard.service';
import { SdCustomersService } from './application/sd-customers.service';
import { DrizzleSdCustomersRepository } from './infrastructure/repositories/drizzle-sd-customers.repo';
import { CustomerAbcService } from './application/customer-abc.service';
import { SD_CUSTOMER_ABC_REPO } from './infrastructure/repositories/i-sd-customer-abc.repo';
import { DrizzleSdCustomerAbcRepository } from './infrastructure/repositories/drizzle-sd-customer-abc.repo';
import { SdLeadsService } from './application/sd-leads.service';
import { SdLeadsRepository } from './infrastructure/repositories/sd-leads.repository';
import { SD_LEADS_REPO } from './domain/repositories/i-sd-leads.repo';
import { QUOTATION_REPO } from './domain/repositories/i-quotation.repo';
import { DrizzleQuotationRepo } from './infrastructure/repositories/drizzle-quotation.repo';
// PA3-17 Wave 3: merged from former modules/sales/
import { SalesController } from './sales/sales.controller';
import { SalesService } from './sales/sales.service';
import { SalesRepository } from './sales/sales.repository';
// T26-4-QC-WMS-SD genuine-gap: lost-orders sabab-katalogi + reklamatsiya SLA-timer
import { SdLostOrdersReclamationsController } from './presentation/sd-lost-orders-reclamations.controller';
import { SdLostOrdersReclamationsService } from './application/sd-lost-orders-reclamations.service';
import { DrizzleSdLostOrdersReclamationsRepo } from './infrastructure/repositories/drizzle-sd-lost-orders-reclamations.repo';
import { SD_LOST_ORDERS_RECLAMATIONS_REPO } from './domain/repositories/i-sd-lost-orders-reclamations.repo';
// EP-SD-154 (vision 06-sd#154): optional legacy 1C (Zakaz 1S) order number on the order header
import { SdLegacyOrderController } from './presentation/sd-legacy-order.controller';
import { SdLegacyOrderService } from './application/sd-legacy-order.service';
import { SdLegacyOrderRepository } from './orders/sd-legacy-order.repository';
// 06-sd #102: mashina formati (72/52SM/KVA) tavsiya+narx katalogi
import { SdMachineFormatController } from './presentation/sd-machine-format.controller';
import { SdMachineFormatService } from './application/sd-machine-format.service';
import { SD_MACHINE_FORMAT_REPO } from './domain/repositories/i-sd-machine-format.repo';
import { DrizzleSdMachineFormatRepo } from './infrastructure/repositories/drizzle-sd-machine-format.repo';
// vision 06-sd#40: Kashirovka offset+gofra sync — predecessor_order_id link + MES can-start gate
import { SdOrderSyncController } from './presentation/sd-order-sync.controller';
import { SdOrderSyncService } from './application/sd-order-sync.service';
import { DrizzleSdOrderSyncRepo } from './infrastructure/repositories/drizzle-sd-order-sync.repo';
import { SD_ORDER_SYNC_REPO } from './domain/repositories/i-sd-order-sync.repo';
// 06-sd #29: per-line deadline scheduling (line_deadline + per_line_scheduling)
import { SdLineDeadlineController } from './presentation/sd-line-deadline.controller';
import { SdLineDeadlineService } from './application/sd-line-deadline.service';
import { DrizzleSdLineDeadlineRepo } from './infrastructure/repositories/drizzle-sd-line-deadline.repo';
import { SD_LINE_DEADLINE_REPO } from './domain/repositories/i-sd-line-deadline.repo';
// 06-sd #27 — nofaol mijoz cron manba (controller + service + repo)
import { SdCustomerInactivityController } from './presentation/sd-customer-inactivity.controller';
import { CustomerInactivityService } from './application/customer-inactivity.service';
import { DrizzleCustomerInactivityRepository } from './infrastructure/repositories/drizzle-customer-inactivity.repo';

const commandHandlers = [
  CreateOrderHandler,
  CreateTestOrderHandler,
  UpdateOrderStatusHandler,
  SignalPendingMaterialHandler,
  ApproveAdvanceBypassHandler,
  ApproveTechCheckpointHandler,
  CreateInvoiceHandler,
  ConfirmAdvancePaymentHandler,
];

const queryHandlers = [
  ListOrdersHandler,
  GetOrderByIdHandler,
  GetOrderItemsHandler,
  AtpCheckHandler,
  PendingAdvanceOrdersHandler,
  GetInvoicesHandler,
  GetInvoiceHandler,
];

const eventListeners = [
  DealWonListener,
  PaymentReceivedListener,
  AdvanceApprovedFanoutListener,
  PpCancelledSdListener, // PP→SD: production order cancelled -> sales order on_hold
  QcFailedSdListener, // 06-sd#35: QC inspection failed -> linked sales order QC_HOLD. Found imported
                       // but NEVER registered here during this pass (a dead listener — @EventsHandler
                       // alone does nothing without provider registration in this module's DI graph) —
                       // fixed in place per Q-46 (found broken, not left broken).
  AutoInvoiceListener, // VISION-3340 #50: billable status transition -> auto draft invoice
  // Owner decision 2026-07-13 (chat): QC defect "customer fault" -> auto-notify sales manager.
  QcCustomerFaultSdListener,
  // Discovery sweep 2026-08-03 ("POS chiqim (EXTERNAL_OUT) harakati SD/logistika modulga
  // event yubormaydi"): POS-initiated external stock-out -> notify the customer's account
  // manager (or all active sales_manager as fallback).
  PosExternalOutSdListener,
];

const repositories = [
  {
    provide: SALES_ORDER_REPO,
    useClass: DrizzleSalesOrderRepository,
  },
];

@Module({
  imports: [CqrsModule, EventEmitterModule.forRoot(), FinanceModule, NotificationsModule],
  controllers: [
    SdLegacyOrderController, // EP-SD-154
    SdOrderSyncController,
    SdLineDeadlineController,
    SdCustomerInactivityController, // 06-sd #27 nofaol mijoz thresholds + manual sweep
    SdKlisheRetentionController,
    SdOrdersController, SdInvoicesController, SdDeliveriesController,
    SdDashboardController, SdCustomersController, SdLeadsController,
    SdPaymentsController, SdQuotationsController, SdContractsController,
    SalesController, SdOrderDepartmentsController,
    SdLostOrdersReclamationsController,
    SdMachineFormatController,
  ],
  providers: [
    SdLegacyOrderService, // EP-SD-154
    SdLegacyOrderRepository,
    SdContractTermsRepository, // #78 vision 06-sd: structured contract terms repo (payment/penalty/penya)
    SdOrderSyncService,
    { provide: SD_ORDER_SYNC_REPO, useClass: DrizzleSdOrderSyncRepo },
    SdLineDeadlineService,
    { provide: SD_LINE_DEADLINE_REPO, useClass: DrizzleSdLineDeadlineRepo },
    // 06-sd #27 — nofaol mijoz cron manba (service + repo)
    CustomerInactivityService,
    DrizzleCustomerInactivityRepository,
    KlisheRetentionService,
    KlisheRetentionCron,
    { provide: KLISHE_RETENTION_REPO, useClass: DrizzleKlisheRetentionRepository },
    loggerProvider,
    TashkentTimeService,
    DrizzleSdAtpRepository,
    ...commandHandlers,
    ...queryHandlers,
    ...eventListeners,
    ...repositories,
    { provide: SD_ORDERS_REPO, useClass: DrizzleSdOrdersRepository },
    OrdersService,
    { provide: SD_INVOICES_REPO, useClass: DrizzleSdInvoicesRepository },
    SdInvoicePdfService,
    SdQuotationPdfService,
    { provide: SD_DELIVERIES_REPO, useClass: DrizzleSdDeliveriesRepository },
    DeliveriesService,
    SdDashboardService,
    SdCustomersService,
    DrizzleSdCustomersRepository,
    CustomerAbcService,
    { provide: SD_CUSTOMER_ABC_REPO, useClass: DrizzleSdCustomerAbcRepository },
    { provide: SD_LEADS_REPO, useClass: SdLeadsRepository },
    SdLeadsService,
    { provide: SD_PAYMENTS_REPO, useClass: SdPaymentsRepository },
    SdPaymentsService,
    { provide: SD_DASHBOARD_REPO, useClass: SdDashboardRepository },
    { provide: SD_QUOTATIONS_REPO, useClass: SdQuotationsRepository },
    SdQuotationsService,
    { provide: QUOTATION_REPO, useClass: DrizzleQuotationRepo },
    // PA3-17 Wave 3: merged from former modules/sales/
    SalesRepository,
    SalesService,
    // Phase 4: per-order department selection (fan-out source)
    SdOrderDepartmentsService,
    SdOrderDepartmentsRepository,
    // T26-4-QC-WMS-SD genuine-gap: lost-orders + reklamatsiya
    SdLostOrdersReclamationsService,
    { provide: SD_LOST_ORDERS_RECLAMATIONS_REPO, useClass: DrizzleSdLostOrdersReclamationsRepo },
    // 06-sd #102: mashina formati (72/52SM/KVA) tavsiya+narx katalogi
    SdMachineFormatService,
    { provide: SD_MACHINE_FORMAT_REPO, useClass: DrizzleSdMachineFormatRepo },
  ],
  exports: [SALES_ORDER_REPO, SalesService],
})
export class SdModule {}
