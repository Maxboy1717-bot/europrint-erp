/**
 * @module sd-orders.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, Inject, Param, ParseIntPipe, Patch, Post, Put, Query, Res, StreamableFile, UseGuards, UseInterceptors, UsePipes, Logger , InternalServerErrorException } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { Readable } from 'stream';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrThrow } from '@common/http-result';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ConfirmAdvancePaymentDtoSchema, ConfirmAdvancePaymentDto } from './dto/confirm-advance-payment.dto';
import { Throttle} from '@nestjs/throttler';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { CommandBus, QueryBus} from '@nestjs/cqrs';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard} from '../../auth/guards/roles.guard';
import { Roles} from '../../auth/decorators/roles.decorator';
import { Role} from '@common/constants/roles.constants';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@auth/types';
import { AuditInterceptor} from '../../shared/interceptors/audit.interceptor';
import { CreateOrderCommand} from '../application/commands/create-order.handler';
import { UpdateOrderStatusCommand} from '../application/commands/update-order-status.handler';
import { SignalPendingMaterialCommand} from '../application/commands/signal-pending-material.handler';
import { ApproveAdvanceBypassCommand} from '../application/commands/approve-advance-bypass.handler';
import { ApproveTechCheckpointCommand} from '../application/commands/approve-tech-checkpoint.handler';
import { ListOrdersQuery} from '../application/queries/list-orders.handler';
import { GetOrderByIdQuery} from '../application/queries/get-order-by-id.handler';
import { GetOrderItemsQuery} from '../application/queries/get-order-items.handler';
import { PendingAdvanceOrdersQuery} from '../application/queries/pending-advance-orders.handler';
import { CreateOrderDtoSchema} from './dto/create-order.dto';
import { AtpCheckDtoSchema } from './dto/atp-check.dto';
import { AtpCheckQuery } from '../application/queries/atp-check.handler';
import { UpdateStatusDtoSchema} from './dto/update-status.dto';
import { MaterialSignalDtoSchema} from './dto/material-signal.dto';
import { AdvanceBypassDtoSchema} from './dto/advance-bypass.dto';
import { TechCheckpointDtoSchema} from './dto/tech-checkpoint.dto';
import { ConfirmAdvancePaymentCommand } from '../application/commands/confirm-advance-payment.handler';
import { LOGGER} from '../../shared/infrastructure/logger.provider';

@ApiTags('Sd Orders')
@ApiBearerAuth()
@Controller('sd/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@ApiThrottle()
export class SdOrdersController {
  private readonly logger = new Logger(SdOrdersController.name);

 constructor(private readonly commandBus: CommandBus,
  private readonly queryBus: QueryBus) {}

 @ApiOperation({ summary: 'Export orders as CSV' })
 @ApiResponse({ status: 200, description: 'CSV file' })
 @Get('export')
 @Roles(Role.SALES_MANAGER, Role.MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN, Role.FINANCE_MANAGER)
 async exportOrders(
  @Query('status') status?: string,
  @Res({ passthrough: true }) res?: FastifyReply,
 ): Promise<StreamableFile> {
  const query = new ListOrdersQuery(undefined, status, 5000, 0);
  const res2 = await this.queryBus.execute(query);
  const data = unwrapOrThrow(res2) as { data: Record<string, unknown>[] };
  const rows = Array.isArray(data?.data) ? data.data : [];

  const header = ['Raqam', 'Holat', 'Summasi', 'Yetkazish sanasi', 'Yaratilgan'].join(',');
  const csvRows = rows.map(o => [
    `"${String(o.orderNumber ?? o.order_number ?? '').replace(/"/g, '""')}"`,
    o.status ?? '',
    o.totalAmount ?? o.total_amount ?? 0,
    o.requestedDeliveryDate ?? o.delivery_date ?? '',
    o.createdAt ?? o.created_at ?? '',
  ].join(','));
  const csv = [header, ...csvRows].join('\n');

  void res!.header('Content-Type', 'text/csv; charset=utf-8')
           .header('Content-Disposition', 'attachment; filename="orders.csv"');
  return new StreamableFile(Readable.from(Buffer.from(csv, 'utf-8')));
 }

 @ApiOperation({ summary: 'List orders' })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get()
 @Roles(Role.SALES_MANAGER, Role.MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN, Role.FINANCE)
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

 @ApiOperation({ summary: 'Get pending advance orders' })
 @ApiResponse({ status: 200, description: 'OK' })
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

 @ApiOperation({ summary: 'Get order' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Get(':id')
 @Roles(Role.SALES_MANAGER, Role.MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
 async getOrder(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
  this.logger.log('Fetching order');
  // audit 2026-08-06 T6 (IDOR item 3): pass the caller for ownership scoping.
  const query = new GetOrderByIdQuery(id, { id: user?.id, role: user?.role });
  const res = await this.queryBus.execute(query);
  return unwrapOrThrow(res);
}

 @ApiOperation({ summary: "Get an order's line-items (Takrorlash/clone enabler)" })
 @ApiResponse({ status: 200, description: 'OK' })
 @Get(':id/items')
 @Roles(Role.SALES_MANAGER, Role.MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
 async getOrderItems(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
  this.logger.log('Fetching order line-items');
  // audit 2026-08-06 T6 (IDOR item 3): pass the caller for ownership scoping.
  const query = new GetOrderItemsQuery(id, { id: user?.id, role: user?.role });
  const res = await this.queryBus.execute(query);
  return unwrapOrThrow(res);
}

 @ApiOperation({ summary: 'Create order' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @Post()
 @Roles(Role.SALES_MANAGER, Role.MANAGER, Role.SUPER_ADMIN)
 async createOrder(@Body() dto: unknown, @CurrentUser() user: AuthenticatedUser) {
  const validated = CreateOrderDtoSchema.parse(dto);
  this.logger.log('Creating order');

  const command = new CreateOrderCommand(
   validated.companyId,
   validated.totalAmount,
   validated.currency,
   validated.designFlag,
   validated.sampleFlag,
   user.id,
   undefined, // dealId
   validated.customerId, // #03 HOP-0: customer link (was hardcoded undefined → customer_id NULL)
   validated.items,
   validated.crmLeadId, // 2.6 golden-thread: originating CRM lead, when the form carries one
  );

  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
}

 @ApiOperation({ summary: 'ATP check — material availability + estimated ready date at order entry (EP-PP-066)' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Order has no material-bound lines' })
 @Post('atp-check')
 @Roles(Role.SALES_MANAGER, Role.MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN, Role.FINANCE)
 async atpCheck(@Body() dto: unknown) {
  const validated = AtpCheckDtoSchema.parse(dto);
  this.logger.log('Running ATP availability check');
  const query = new AtpCheckQuery(validated.orderId ?? null, validated.items ?? null);
  const res = await this.queryBus.execute(query);
  return unwrapOrThrow(res);
 }

 @ApiOperation({ summary: 'Update status' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Patch(':id/status')
 @Roles(Role.SALES_MANAGER, Role.MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
 async updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: unknown) {
  const validated = UpdateStatusDtoSchema.parse(dto);
  this.logger.log('Updating order status');

  const command = new UpdateOrderStatusCommand(id, validated.newStatus);
  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
}
 // NOTE: order-cancel is already handled by SdQuotationsController (svc.cancelOrder); the re-audit's
 // "404" was wrong. No cancel handler added here to avoid a duplicate route. FE contract already satisfied.

 @ApiOperation({ summary: 'Bypass advance' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Post(':id/advance-bypass')
 @Roles(Role.DIRECTOR, Role.SUPER_ADMIN)
 async bypassAdvance(@Param('id', ParseIntPipe) id: number, @Body() dto: unknown, @CurrentUser() user: AuthenticatedUser) {
  const validated = AdvanceBypassDtoSchema.parse(dto);
  this.logger.log('Approving advance bypass');

  const command = new ApproveAdvanceBypassCommand(id, user.id, validated.reason);
  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
}

 @ApiOperation({ summary: 'Approve checkpoint' })
 @ApiResponse({ status: 200, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Patch(':id/tech-checkpoint')
 @Roles(Role.TECHNOLOGIST, Role.SUPER_ADMIN)
 async approveCheckpoint(@Param('id', ParseIntPipe) id: number, @Body() dto: unknown) {
  const validated = TechCheckpointDtoSchema.parse(dto);
  this.logger.log('Approving tech checkpoint');

  const command = new ApproveTechCheckpointCommand(id, validated.type);
  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
}

 @ApiOperation({ summary: 'Confirm advance payment' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Post(':id/advance-payment')
 @Roles(Role.FINANCE, Role.FINANCE_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN)
 @UsePipes(new ZodValidationPipe(ConfirmAdvancePaymentDtoSchema))
 async confirmAdvancePayment(@Param('id', ParseIntPipe) id: number, @Body() dto: ConfirmAdvancePaymentDto) {
  const command = new ConfirmAdvancePaymentCommand(Number(id), dto.amount, dto.idempotencyKey);
  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
 }

 @ApiOperation({ summary: 'Put order status' })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 400, description: 'Bad request' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @Put(':id/status')
 @Roles(Role.SALES_MANAGER, Role.MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
 async putOrderStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: unknown) {
  const validated = UpdateStatusDtoSchema.parse(dto);
  const command = new UpdateOrderStatusCommand(id, validated.newStatus);
  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
 }

 @ApiOperation({ summary: "Signal Ta'minot: order awaiting raw material (Ожд.Сырьё)" })
 @ApiResponse({ status: 201, description: 'OK' })
 @ApiResponse({ status: 404, description: 'Not found' })
 @ApiResponse({ status: 409, description: 'Order not in a signalable state' })
 @Post(':id/material-signal')
 @Roles(Role.SALES_MANAGER, Role.MANAGER, Role.SUPER_ADMIN, Role.DIRECTOR)
 async signalMaterial(@Param('id', ParseIntPipe) id: number, @Body() dto: unknown) {
  const validated = MaterialSignalDtoSchema.parse(dto);
  this.logger.log('Signalling order awaiting raw material');
  const command = new SignalPendingMaterialCommand(id, validated.reason ?? null);
  const res = await this.commandBus.execute(command);
  return unwrapOrThrow(res);
 }
}
