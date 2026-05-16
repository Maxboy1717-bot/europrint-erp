/**
 * @module sd.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SdOrdersController } from './presentation/sd-orders.controller';
import { SdInvoicesController } from './presentation/sd-invoices.controller';
import { SdDeliveriesController } from './presentation/sd-deliveries.controller';
import { SdDashboardController } from './presentation/sd-dashboard.controller';
import { SdCustomersController } from './presentation/sd-customers.controller';
import { SdLeadsController } from './presentation/sd-leads.controller';
import { SdPaymentsController } from './presentation/sd-payments.controller';
import { SdQuotationsController } from './presentation/sd-quotations.controller';
import { SdContractsController } from './presentation/sd-contracts.controller';
import { SdPaymentsService } from './application/sd-payments.service';
import { SdPaymentsRepository } from './application/sd-payments.repository';
import { SdDashboardRepository } from './application/sd-dashboard.repository';
import { SdQuotationsService } from './application/sd-quotations.service';
import { SdQuotationsRepository } from './application/sd-quotations.repository';
import { CreateOrderHandler } from './application/commands/create-order.handler';
import { UpdateOrderStatusHandler } from './application/commands/update-order-status.handler';
import { ApproveAdvanceBypassHandler } from './application/commands/approve-advance-bypass.handler';
import { ApproveTechCheckpointHandler } from './application/commands/approve-tech-checkpoint.handler';
import { CreateInvoiceHandler } from './application/commands/create-invoice.handler';
import { ConfirmAdvancePaymentHandler } from './application/commands/confirm-advance-payment.handler';
import { ListOrdersHandler } from './application/queries/list-orders.handler';
import { GetOrderByIdHandler } from './application/queries/get-order-by-id.handler';
import { PendingAdvanceOrdersHandler } from './application/queries/pending-advance-orders.handler';
import { GetInvoicesHandler } from './application/queries/get-invoices.handler';
import { GetInvoiceHandler } from './application/queries/get-invoice.handler';
import { DrizzleSalesOrderRepository } from './infrastructure/repositories/drizzle-sales-order.repo';
import { SALES_ORDER_REPO } from './domain/repositories/i-sales-order.repo';
import { DealWonListener } from './infrastructure/event-handlers/deal-won.listener';
import { PaymentReceivedListener } from './infrastructure/event-handlers/payment-received.listener';
import { loggerProvider } from '../shared/infrastructure/logger.provider';
import { SD_ORDERS_REPO } from './orders/i-sd-orders.repo';
import { DrizzleSdOrdersRepository } from './orders/drizzle-sd-orders.repo';
import { OrdersService } from './orders/orders.service';
import { SD_INVOICES_REPO } from './invoices/i-sd-invoices.repo';
import { DrizzleSdInvoicesRepository } from './invoices/drizzle-sd-invoices.repo';
import { InvoicesService } from './invoices/invoices.service';
import { SD_DELIVERIES_REPO } from './deliveries/i-sd-deliveries.repo';
import { DrizzleSdDeliveriesRepository } from './deliveries/drizzle-sd-deliveries.repo';
import { DeliveriesService } from './deliveries/deliveries.service';
import { SdDashboardService } from './application/sd-dashboard.service';
import { SdCustomersService } from './application/sd-customers.service';
import { DrizzleSdCustomersRepository } from './infrastructure/repositories/drizzle-sd-customers.repo';
import { SdLeadsService } from './application/sd-leads.service';
import { SdLeadsRepository } from './application/sd-leads.repository';
import { QUOTATION_REPO } from './domain/repositories/i-quotation.repo';
import { DrizzleQuotationRepo } from './infrastructure/repositories/drizzle-quotation.repo';

const commandHandlers = [
  CreateOrderHandler,
  UpdateOrderStatusHandler,
  ApproveAdvanceBypassHandler,
  ApproveTechCheckpointHandler,
  CreateInvoiceHandler,
  ConfirmAdvancePaymentHandler,
];

const queryHandlers = [
  ListOrdersHandler,
  GetOrderByIdHandler,
  PendingAdvanceOrdersHandler,
  GetInvoicesHandler,
  GetInvoiceHandler,
];

const eventListeners = [DealWonListener, PaymentReceivedListener];

const repositories = [
  {
    provide: SALES_ORDER_REPO,
    useClass: DrizzleSalesOrderRepository,
  },
];

@Module({
  imports: [CqrsModule, EventEmitterModule.forRoot()],
  controllers: [
    SdOrdersController, SdInvoicesController, SdDeliveriesController,
    SdDashboardController, SdCustomersController, SdLeadsController,
    SdPaymentsController, SdQuotationsController, SdContractsController,
  ],
  providers: [
    loggerProvider,
    ...commandHandlers,
    ...queryHandlers,
    ...eventListeners,
    ...repositories,
    { provide: SD_ORDERS_REPO, useClass: DrizzleSdOrdersRepository },
    OrdersService,
    { provide: SD_INVOICES_REPO, useClass: DrizzleSdInvoicesRepository },
    InvoicesService,
    { provide: SD_DELIVERIES_REPO, useClass: DrizzleSdDeliveriesRepository },
    DeliveriesService,
    SdDashboardService,
    SdCustomersService,
    DrizzleSdCustomersRepository,
    SdLeadsRepository,
    SdLeadsService,
    SdPaymentsRepository,
    SdPaymentsService,
    SdDashboardRepository,
    SdQuotationsRepository,
    SdQuotationsService,
    { provide: QUOTATION_REPO, useClass: DrizzleQuotationRepo },
  ],
  exports: [SALES_ORDER_REPO],
})
export class SdModule {}
