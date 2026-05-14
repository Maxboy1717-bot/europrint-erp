/**
 * @module order-costing.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { OrderCostingService } from '../order-costing/order-costing.service';
import { CreateOrderCostingSchema } from './dto/finance-dtos';
import { unwrapOrInternal } from '@common/http-result';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('order-costing')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR', 'PRODUCTION_MANAGER')
export class OrderCostingController {
  constructor(private readonly svc: OrderCostingService) {}

  @Get('top-profitable')
  async getTopProfitable(@Query('limit') limit?: string) {
    return unwrapOrInternal(await this.svc.findTopProfitable(limit ? Number(limit) : 10));
  }

  @Get('top-loss')
  async getTopLoss(@Query('limit') limit?: string) {
    return unwrapOrInternal(await this.svc.findTopLoss(limit ? Number(limit) : 10));
  }

  @Get()
  async getAll(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findAll(query));
  }

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    const dto = CreateOrderCostingSchema.parse(body);
    return unwrapOrInternal(await this.svc.create(dto as Record<string, unknown>));
  }

  @Post(':id/calculate')
  async calculate(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.calculate(id));
  }
}
