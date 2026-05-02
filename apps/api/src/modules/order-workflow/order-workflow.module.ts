import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { OrderWorkflowController } from './presentation/order-workflow.controller';

import { CreateOrderHandler } from './application/commands/create-order.handler';
import { TransitionStatusHandler } from './application/commands/transition-status.handler';
import { CreatePaymentPlanHandler } from './application/commands/create-payment-plan.handler';
import { GetOrderSagaHandler } from './application/queries/get-order-saga.handler';
import { ListOrdersHandler } from './application/queries/list-orders.handler';

import { DrizzleOrderRepo } from './infrastructure/repositories/drizzle-order.repo';
import { ORDER_WF_REPO } from './infrastructure/repositories/i-order.repo';
import { OrderTransitionGuard } from './presentation/guards/order-transition.guard';

const commandHandlers = [
  CreateOrderHandler,
  TransitionStatusHandler,
  CreatePaymentPlanHandler,
];

const queryHandlers = [
  GetOrderSagaHandler,
  ListOrdersHandler,
];

@Module({
  imports: [
    CqrsModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [OrderWorkflowController],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    { provide: ORDER_WF_REPO, useClass: DrizzleOrderRepo },
    OrderTransitionGuard,
  ],
  exports: [],
})
export class OrderWorkflowModule {}
