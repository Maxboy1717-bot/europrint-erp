/**
 * @module sales-orders-standalone.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { SalesOrdersFiService } from '../sales-orders-fi/sales-orders-fi.service';
import { unwrapOrInternal } from '@common/http-result';

@ApiThrottle()
@ApiTags('Sales Orders Standalone')
@Controller('sales-orders')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('FINANCE_MANAGER', 'SALES_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR')
export class SalesOrdersStandaloneController {
  constructor(private readonly svc: SalesOrdersFiService) {}

  @ApiOperation({ summary: 'Get all' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async getAll(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findAll(query));
  }
}
