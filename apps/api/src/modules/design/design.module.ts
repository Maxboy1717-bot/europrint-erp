/**
 * @module design.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RequestDesignHandler } from './application/commands/request-design.handler';
import { UpdateDesignStatusHandler } from './application/commands/update-design-status.handler';
import { GetDesignOrdersHandler } from './application/queries/get-design-orders.handler';
import { GetDesignOrderHandler } from './application/queries/get-design-order.handler';
import { SoDesignRequestedListener } from './infrastructure/event-handlers/so-design-requested.listener';
import { DesignController } from './presentation/design.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { DESIGN_REPO } from './domain/repositories/i-design.repo';
import { DrizzleDesignRepository } from './infrastructure/repositories/drizzle-design.repo';
import { OrdersService } from './orders/orders.service';
import { DrizzleDesignOrdersSvcRepository } from './orders/drizzle-design-orders-svc.repo';
import { DESIGN_ORDERS_SVC_REPO } from './orders/i-design-orders-svc.repo';
import { DesignExtendedController } from './presentation/design-extended.controller';
import { DesignExtendedService } from './application/design-extended.service';
import { DesignExtendedRepository } from './application/design-extended.repository';

const commandHandlers = [RequestDesignHandler, UpdateDesignStatusHandler];
const eventHandlers = [SoDesignRequestedListener];
const queryHandlers = [GetDesignOrdersHandler, GetDesignOrderHandler];
const repositories = [
  {
    provide: DESIGN_REPO,
    useClass: DrizzleDesignRepository,
  },
  { provide: DESIGN_ORDERS_SVC_REPO, useClass: DrizzleDesignOrdersSvcRepository },
];

@Module({
  imports: [CqrsModule, NotificationsModule, AuthModule],
  controllers: [DesignController, DesignExtendedController],
  providers: [...commandHandlers, ...eventHandlers, ...queryHandlers, ...repositories, OrdersService, DesignExtendedService, DesignExtendedRepository],
  exports: [DESIGN_REPO, DESIGN_ORDERS_SVC_REPO, OrdersService],
})
export class DesignModule {}
