/**
 * @module sd.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
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
import { ApproveAdvanceBypassHandler } from './application/commands/approve-advance-bypass.handler';
import { ApproveTechCheckpointHandler } from './application/commands/approve-tech-checkpoint.handler';
import { CreateInvoiceHandler } from './application/commands/create-invoice.handler';
import { ConfirmAdvancePaymentHandler } from './application/commands/confirm-advance-payment.handler';
import { ListOrdersHandler } from './application/queries/list-orders.handler';
import { GetOrderByIdHandler } from './application/queries/get-order-by-id.handler';
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
import { loggerProvider } from '../shared/infrastructure/logger.provider';
import { TashkentTimeService } from '@common/time';
import { SD_ORDERS_REPO } from './orders/i-sd-orders.repo';
import { DrizzleSdOrdersRepository } from './orders/drizzle-sd-orders.repo';
import { OrdersService } from './orders/orders.service';
import { SD_INVOICES_REPO } from './invoices/i-sd-invoices.repo';
import { DrizzleSdInvoicesRepository } from './invoices/drizzle-sd-invoices.repo';
import { SdInvoicePdfService } from './invoices/sd-invoice-pdf.service';
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

const commandHandlers = [
  CreateOrderHandler,
  CreateTestOrderHandler,
  UpdateOrderStatusHandler,
  ApproveAdvanceBypassHandler,
  ApproveTechCheckpointHandler,
  CreateInvoiceHandler,
  ConfirmAdvancePaymentHandler,
];

const queryHandlers = [
  ListOrdersHandler,
  GetOrderByIdHandler,
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
];

const repositories = [
  {
    provide: SALES_ORDER_REPO,
    useClass: DrizzleSalesOrderRepository,
  },
];

@Module({
  imports: [CqrsModule, EventEmitterModule.forRoot(), FinanceModule],
  controllers: [
    SdOrdersController, SdInvoicesController, SdDeliveriesController,
    SdDashboardController, SdCustomersController, SdLeadsController,
    SdPaymentsController, SdQuotationsController, SdContractsController,
    SalesController, SdOrderDepartmentsController,
    SdLostOrdersReclamationsController,
  ],
  providers: [
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
  ],
  exports: [SALES_ORDER_REPO, SalesService],
})
export class SdModule {}
