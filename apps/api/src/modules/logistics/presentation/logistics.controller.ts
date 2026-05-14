/**
 * @module logistics.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors, BadRequestException, InternalServerErrorException} from '@nestjs/common';
import { throwFromError, assertOk } from '@common/http-result';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { EventEmitter2} from '@nestjs/event-emitter';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard} from '@common/guards/roles.guard';
import { Roles} from '@common/decorators/roles.decorator';
import { AuditInterceptor} from '@common/interceptors/audit.interceptor';
import { ERP_EVENTS} from '@common/constants/erp-events.constants';
import { DispatchDeliveryCommand} from '../application/commands/dispatch-delivery.command';
import { AssignDriverCommand} from '../application/commands/assign-driver.command';
import { GetDeliveriesQuery} from '../application/queries/get-deliveries.query';
import { DispatchDeliveryDto, AssignDriverDto, CompleteDeliveryDto} from './dto/logistics.dto';
import { IDeliveryRepo, DELIVERY_REPO } from '../domain/repositories/i-delivery.repo';

enum Role {
 SUPER_ADMIN = 'super_admin',
 DIRECTOR = 'director',
 DRIVER = 'driver',
 WAREHOUSE_MANAGER = 'warehouse_manager',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('logistics')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class LogisticsController {
  private readonly logger = new Logger(LogisticsController.name);

 constructor(
 private readonly commandBus: CommandBus,
 private readonly queryBus: QueryBus,
 private readonly eventEmitter: EventEmitter2,
 @Inject(DELIVERY_REPO) private readonly deliveryRepo: IDeliveryRepo,
 ) {}

 @Get()
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.WAREHOUSE_MANAGER)
 async getAll(
 @Query('status') status?: string,
 @Query('driverId') driverId?: string,
 @Query('page') page?: string,
 @Query('limit') limit?: string) {
 const filters = {
 status,
 driverId,
 page: page ? parseInt(page, 10) : 1,
 limit: limit ? parseInt(limit, 10) : 10,
};

 const result = await this.queryBus.execute(new GetDeliveriesQuery(filters));

 assertOk(result);
 return result.data;
}

 @Get(':id')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.WAREHOUSE_MANAGER)
 async getById(@Param('id') id: string) {
   const result = await this.deliveryRepo.findById(id);
   if (!result.ok || !result.data) throw new NotFoundException(`Yetkazib berish #${id} topilmadi`);
   return { statusCode: HttpStatus.OK, data: result.data };
}

 @Post()
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.WAREHOUSE_MANAGER)
 async dispatchDelivery(
 @Body() dto: DispatchDeliveryDto) {
 const cmd = new DispatchDeliveryCommand(dto.deliveryId ?? '', dto.orderId, dto.driverId);
 const result = await this.commandBus.execute(cmd);

 assertOk(result);
 this.logger.log('Delivery dispatched');

 return result.data;
}

 @Patch(':id/assign-driver')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
 async assignDriver(
 @Param('id') id: string,
 @Body() dto: AssignDriverDto) {
 const cmd = new AssignDriverCommand(id, dto.driverId, dto.vehicleNumber);
 const result = await this.commandBus.execute(cmd);

 assertOk(result);
 this.logger.log('Driver assigned');

 return result.data;
}

 @Patch(':id/complete')
 @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
 async completeDelivery(
 @Param('id') id: string,
 @Body() dto?: CompleteDeliveryDto) {
 this.logger.log('Completing delivery');

 // Emit completion event (Trigger 14)
 this.eventEmitter.emit(ERP_EVENTS.LOGISTICS_DELIVERY_COMPLETED, {
 deliveryId: id,
 completedAt: _time.now(),
 timestamp: _time.now(),
});

 this.logger.log('Trigger 14: Delivery completed event emitted');

 return {
 statusCode: HttpStatus.OK,
 data: { id, status: 'completed'},
};
}
}
