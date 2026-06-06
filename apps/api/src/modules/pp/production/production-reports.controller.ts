/**
 * @module production-reports.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { assertFound } from '@common/assertions';
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ProductionService } from './production.service';
import { safeInt } from '../../hr/common/db-rows';

import { MS_PER_DAY } from '@common/constants/app.constants';
import { notImplemented } from '@common/exceptions/not-implemented';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

type Rows = { rows?: unknown[] };
const PROD_ROLES = ['super_admin', 'director', 'production_manager', 'operator', 'technologist'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Production Reports')
@Controller('production')
@UseGuards(RolesGuard)
@Roles(...PROD_ROLES)
export class ProductionReportsController {
  private readonly logger = new Logger(ProductionReportsController.name);

  constructor(private readonly svc: ProductionService) {}

  @ApiOperation({ summary: 'Weekly report' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('reports/weekly')
  async weeklyReport(
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const s = start || new Date(Date.now() - 30 * MS_PER_DAY).toISOString();
    const e = end || _time.now().toISOString();
    return unwrapOrThrow(await this.svc.weeklyReport(s, e));
  }

  @ApiOperation({ summary: 'Stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stats')
  async stats() {
    return unwrapOrThrow(await this.svc.getProductionStats());
  }

  @ApiOperation({ summary: 'Order360 card' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('orders/:id/360-card')
  async order360Card(@Param('id') id: string) {
    const r = await this.svc.getOrder360Card(safeInt(id, 0));
    assertFound(r, 'Production order not found');
    return r;
  }

  @ApiOperation({ summary: 'Get production orders (production_orders)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('orders')
  async getOrders(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const lim = Math.min(parseInt(limit ?? '100', 10) || 100, 500);
    const r = await db.execute(sql`
      SELECT * FROM production_orders
      WHERE deleted_at IS NULL
      ${status ? sql`AND status = ${status}` : sql``}
      ORDER BY created_at DESC
      LIMIT ${lim}
    `);
    const items = ((r as Rows).rows) ?? [];
    return { items, total: items.length };
  }
}
