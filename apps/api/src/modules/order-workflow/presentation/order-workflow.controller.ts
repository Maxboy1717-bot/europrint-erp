/**
 * @module order-workflow.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Get, Logger, Param,
  Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { OrderTransitionGuard } from './guards/order-transition.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/types/user.types';
import { unwrapOrThrow } from '@common/http-result';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { QUERY_TIMEOUT_MS } from '@common/constants/app.constants';

import { CreateOrderCommand } from '../application/commands/create-order.handler';
import { TransitionStatusCommand } from '../application/commands/transition-status.handler';
import { CreatePaymentPlanCommand } from '../application/commands/create-payment-plan.handler';
import { GetOrderSagaQuery } from '../application/queries/get-order-saga.handler';
import { ListOrdersQuery } from '../application/queries/list-orders.handler';

import { CreateOrderDtoSchema, CreateOrderDto } from './dtos/create-order.dto';
import { TransitionStatusDtoSchema, TransitionStatusDto } from './dtos/transition-status.dto';
import { PaymentPlanDtoSchema, PaymentPlanDto } from './dtos/payment-plan.dto';

const WRITER_ROLES  = ['SUPER_ADMIN', 'DIRECTOR', 'SALES_MANAGER'];
const READER_ROLES  = ['SUPER_ADMIN', 'DIRECTOR', 'SALES_MANAGER', 'FINANCE', 'PRODUCTION_MANAGER'];
const FINANCE_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'FINANCE'];

const DEFAULT_LIMIT  = 50;
const DEFAULT_OFFSET = 0;

@Controller('order-workflow')
@Throttle({ default: { limit: 120, ttl: QUERY_TIMEOUT_MS } })
export class OrderWorkflowController {
  private readonly logger = new Logger(OrderWorkflowController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus:   QueryBus,
  ) {}

  @Post('orders')
  @Roles(...WRITER_ROLES)
  async createOrder(
    @Body(new ZodValidationPipe(CreateOrderDtoSchema)) dto: CreateOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.log({ msg: 'Yangi buyurtma', customerId: dto.customerId, actorId: user.id });
    const cmd = new CreateOrderCommand(
      dto.customerId ?? null,
      dto.totalAmount,
      dto.currency,
      dto.assignedSalesManager ?? null,
      user.id,
    );
    const result = await this.commandBus.execute(cmd);
    return unwrapOrThrow(result);
  }

  @Patch('orders/:id/status')
  @Roles(...WRITER_ROLES)
  @UseGuards(OrderTransitionGuard)
  async transitionStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TransitionStatusDtoSchema)) dto: TransitionStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.log({ msg: "Status o'zgartirish", id, toStatus: dto.toStatus, actorId: user.id });
    const cmd = new TransitionStatusCommand(
      id, dto.toStatus, dto.reason, user.id, String(user.role), user.id,
    );
    const result = await this.commandBus.execute(cmd);
    return unwrapOrThrow(result);
  }

  @Post('orders/:id/payment-plan')
  @Roles(...FINANCE_ROLES)
  async createPaymentPlan(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(PaymentPlanDtoSchema)) dto: PaymentPlanDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.log({ msg: "To'lov rejasi", id, entryCount: (dto.entries ?? []).length, actorId: user.id });
    const cmd = new CreatePaymentPlanCommand(id, dto.entries, user.id);
    const result = await this.commandBus.execute(cmd);
    return unwrapOrThrow(result);
  }

  @Get('orders/:id/saga-status')
  @Roles(...READER_ROLES)
  @UseGuards(OrderTransitionGuard)
  async getSagaStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.log({ msg: "Saga status so'rov", id, actorId: user.id });
    const result = await this.queryBus.execute(
      new GetOrderSagaQuery(id, String(user.role), user.id),
    );
    return unwrapOrThrow(result);
  }

  @Get('orders')
  @Roles(...READER_ROLES)
  async listOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status')     status?: string,
    @Query('customerId') customerId?: number,
    @Query('limit')      limit: number = DEFAULT_LIMIT,
    @Query('offset')     offset: number = DEFAULT_OFFSET,
  ) {
    const query = new ListOrdersQuery(
      status, customerId, limit, offset, String(user.role), user.id,
    );
    const result = await this.queryBus.execute(query);
    return unwrapOrThrow(result);
  }
}
