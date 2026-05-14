/**
 * @module sd-orders.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, Inject, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards, UseInterceptors, UsePipes, Logger , InternalServerErrorException } from '@nestjs/common';
import { unwrapOrThrow } from '@common/http-result';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ConfirmAdvancePaymentDtoSchema, ConfirmAdvancePaymentDto } from './dto/confirm-advance-payment.dto';
import { Throttle} from '@nestjs/throttler';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard} from '../../auth/guards/roles.guard';
import { Roles} from '../../auth/decorators/roles.decorator';
import { Role} from '../../auth/enums/role.enum';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@auth/types';
import { AuditInterceptor} from '../../shared/interceptors/audit.interceptor';
import { CreateOrderCommand} from '../application/commands/create-order.handler';
import { UpdateOrderStatusCommand} from '../application/commands/update-order-status.handler';
import { ApproveAdvanceBypassCommand} from '../application/commands/approve-advance-bypass.handler';
import { ApproveTechCheckpointCommand} from '../application/commands/approve-tech-checkpoint.handler';
import { ListOrdersQuery} from '../application/queries/list-orders.handler';
import { GetOrderByIdQuery} from '../application/queries/get-order-by-id.handler';
import { PendingAdvanceOrdersQuery} from '../application/queries/pending-advance-orders.handler';
import { CreateOrderDtoSchema} from './dto/create-order.dto';
import { UpdateStatusDtoSchema} from './dto/update-status.dto';
import { AdvanceBypassDtoSchema} from './dto/advance-bypass.dto';
import { TechCheckpointDtoSchema} from './dto/tech-checkpoint.dto';
import { ConfirmAdvancePaymentCommand } from '../application/commands/confirm-advance-payment.handler';
import { LOGGER} from '../../shared/infrastructure/logger.provider';

@Controller('sd/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Throttle({ default: { limit: 100, ttl: 60_000 } })
export class SdOrdersController {
  private readonly logger = new Logger(SdOrdersController.name);

 constructor(private readonly commandBus: CommandBus,
  private readonly queryBus: QueryBus) {}

 @Get()
 @Roles(Role.SALES_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN, Role.FINANCE)
 async listOrders(
  @Query('companyId') companyId?: number,
  @Query('status') status?: string,
  @Query('limit') limit: number = 20,
  @Query('offset') offset: number = 0,
 ) {
  this.logger.log('Listing orders');
  const query = new ListOrdersQuery(companyId, status, limit, offset);
  const res = await this.queryBus.execute(query);
  return unwrapOrThrow(res);
}

 @Get('pending-advance')
 @Roles(Role.FINANCE, Role.DIRECTOR, Role.SUPER_ADMIN)
 async getPendingAdvanceOrders(
  @Query('limit') limit: number = 50,
  @Query('offset') offset: number = 0,
 ) {
  this.logger.log('Fetching pending advance orders');
  const query = new PendingAdvanceOrdersQuery(limit, offset);
  const res = await this.queryBus.execute(query);
  return unwrapOrThrow(res);
}

 @Get(':id')
 @Roles(Role.SALES_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
 async getOrder(@Param('id', ParseIntPipe) id: number) {
  this.logger.log('Fetching order');
  const query = new GetOrderByIdQuery(id);
  const res = await this.queryBus.execute(query);
  return unwrapOrThrow(res);
}

 @Post()
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN)
 async createOrder(@Body() dto: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
  const validated = CreateOrderDtoSchema.parse(dto);
  this.logger.log('Creating order');

  const command = new CreateOrderCommand(
   validated.companyId,
   validated.totalAmount,
   validated.currency,
   validated.designFlag,
   validated.sampleFlag,
   user.id,
  );

  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
}

 @Patch(':id/status')
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
 async updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: Record<string, unknown>) {
  const validated = UpdateStatusDtoSchema.parse(dto);
  this.logger.log('Updating order status');

  const command = new UpdateOrderStatusCommand(id, validated.newStatus);
  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
}

 @Post(':id/advance-bypass')
 @Roles(Role.DIRECTOR, Role.SUPER_ADMIN)
 async bypassAdvance(@Param('id', ParseIntPipe) id: number, @Body() dto: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
  const validated = AdvanceBypassDtoSchema.parse(dto);
  this.logger.log('Approving advance bypass');

  const command = new ApproveAdvanceBypassCommand(id, user.id, validated.reason);
  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
}

 @Patch(':id/tech-checkpoint')
 @Roles(Role.TECHNOLOGIST, Role.SUPER_ADMIN)
 async approveCheckpoint(@Param('id', ParseIntPipe) id: number, @Body() dto: Record<string, unknown>) {
  const validated = TechCheckpointDtoSchema.parse(dto);
  this.logger.log('Approving tech checkpoint');

  const command = new ApproveTechCheckpointCommand(id, validated.type);
  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
}

 @Post(':id/advance-payment')
 @Roles(Role.FINANCE, Role.FINANCE_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
 @UsePipes(new ZodValidationPipe(ConfirmAdvancePaymentDtoSchema))
 async confirmAdvancePayment(@Param('id', ParseIntPipe) id: number, @Body() dto: ConfirmAdvancePaymentDto) {
  const command = new ConfirmAdvancePaymentCommand(Number(id), dto.amount, dto.idempotencyKey);
  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
 }

 @Put(':id/status')
 @Roles(Role.SALES_MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
 async putOrderStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: Record<string, unknown>) {
  const validated = UpdateStatusDtoSchema.parse(dto);
  const command = new UpdateOrderStatusCommand(id, validated.newStatus);
  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
 }
}
