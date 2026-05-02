import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DispatchDeliveryHandler } from './application/commands/dispatch-delivery.handler';
import { AssignDriverHandler } from './application/commands/assign-driver.handler';
import { CompleteDeliveryHandler } from './application/commands/complete-delivery.handler';
import { GetDeliveriesHandler } from './application/queries/get-deliveries.handler';
import { SalesOrderConfirmedListener } from './infrastructure/event-handlers/sales-order-confirmed.listener';
import { LogisticsController } from './presentation/logistics.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { DELIVERY_REPO } from './domain/repositories/i-delivery.repo';
import { DrizzleDeliveryRepository } from './infrastructure/repositories/drizzle-delivery.repo';
import { DeliveriesService } from './deliveries/deliveries.service';
import { DrizzleDeliveriesRepository } from './deliveries/drizzle-deliveries.repo';
import { DELIVERIES_REPO } from './deliveries/i-deliveries.repo';
import { GeoService } from './domain/services/geo.service';
import { RouteService } from './domain/services/route.service';
import { VrpService } from './domain/services/vrp.service';

const commandHandlers = [DispatchDeliveryHandler, AssignDriverHandler, CompleteDeliveryHandler];
const eventHandlers = [SalesOrderConfirmedListener];
const queryHandlers = [GetDeliveriesHandler];
const repositories = [
  {
    provide: DELIVERY_REPO,
    useClass: DrizzleDeliveryRepository,
  },
  { provide: DELIVERIES_REPO, useClass: DrizzleDeliveriesRepository },
];

@Module({
  imports: [CqrsModule, NotificationsModule],
  controllers: [LogisticsController],
  providers: [...commandHandlers, ...eventHandlers, ...queryHandlers, ...repositories, DeliveriesService, GeoService, RouteService, VrpService],
  exports: [DELIVERY_REPO, DELIVERIES_REPO, DeliveriesService, GeoService, RouteService, VrpService],
})
export class LogisticsModule {}
