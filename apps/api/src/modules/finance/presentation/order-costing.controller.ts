/**
 * @module order-costing.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { OrderCostingService } from '../order-costing/order-costing.service';
import { CreateOrderCostingSchema } from './dto/finance-dtos';
import { unwrapOrInternal } from '@common/http-result';

@ApiThrottle()
@ApiTags('Order Costing')
@Controller('order-costing')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR', 'PRODUCTION_MANAGER')
export class OrderCostingController {
  constructor(private readonly svc: OrderCostingService) {}

  @ApiOperation({ summary: 'Get top profitable' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('top-profitable')
  async getTopProfitable(@Query('limit') limit?: string) {
    return unwrapOrInternal(await this.svc.findTopProfitable(limit ? Number(limit) : 10));
  }

  @ApiOperation({ summary: 'Get top loss' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('top-loss')
  async getTopLoss(@Query('limit') limit?: string) {
    return unwrapOrInternal(await this.svc.findTopLoss(limit ? Number(limit) : 10));
  }

  @ApiOperation({ summary: 'Get all' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async getAll(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findAll(query));
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  async create(@Body() body: unknown) {
    const dto = CreateOrderCostingSchema.parse(body);
    return unwrapOrInternal(await this.svc.create(dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Calculate' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/calculate')
  async calculate(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.calculate(id));
  }
}
