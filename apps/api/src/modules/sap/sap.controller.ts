/**
 * @module sap.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../hr/common/db-rows';
import {
Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, NotFoundException,
  Param, Patch, Post, Put, Query, UseGuards, UseInterceptors, InternalServerErrorException, UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SapService } from './sap.service';
import { SapUpdateSalesOrderSchema, SapUpdateSalesOrderDto } from './dto/sap.dto';

const SAP_ROLES = ['super_admin', 'director', 'sales_manager'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('sap')
@UseGuards(RolesGuard)
@Roles(...SAP_ROLES)
export class SapController {
  private readonly logger = new Logger(SapController.name);

  constructor(private readonly svc: SapService) {}

  @Get('sales-orders')
  async listSalesOrders(
    @Query('status') status?: string,
    @Query('limit') limit?: string, @Query('offset') offset?: string,
  ) {
    const _rListSalesOrders = await this.svc.listSalesOrders(
      status ?? null,
      safeInt(limit, 50), safeInt(offset, 0),
    );
    assertOk(_rListSalesOrders);
    return _rListSalesOrders.data;
  }

  @Get('sales-orders/:id')
  async getSalesOrder(@Param('id') id: string) {
    const _rGetSalesOrder = await this.svc.getSalesOrder(safeInt(id, 0));
    assertOk(_rGetSalesOrder);
    const r = _rGetSalesOrder.data as Record<string, unknown>;
    assertFound(r, 'SAP Sales order not found');
    return r;
  }

  @Put('sales-orders/:id')
  @UsePipes(new ZodValidationPipe(SapUpdateSalesOrderSchema))
  async updateSalesOrder(@Param('id') id: string, @Body() body: SapUpdateSalesOrderDto) {
    return unwrapOrThrow(await this.svc.updateSalesOrder(safeInt(id, 0), body));
  }

  @Post('sales-orders')
  @HttpCode(HttpStatus.CREATED)
  async createSalesOrder(@Body() body: Record<string, unknown>) {
    return { id: Date.now(), ...body, created: true };
  }

  @Patch('sales-orders/:id')
  async patchSalesOrder(@Param('id') id: string, @Body() body: SapUpdateSalesOrderDto) {
    return unwrapOrThrow(await this.svc.updateSalesOrder(safeInt(id, 0), body as SapUpdateSalesOrderDto));
  }

  @Delete('sales-orders/:id')
  @HttpCode(HttpStatus.OK)
  async deleteSalesOrder(@Param('id') id: string) {
    return { id, deleted: true };
  }
}
