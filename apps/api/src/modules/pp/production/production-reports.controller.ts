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
import { I18nService } from 'nestjs-i18n';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ProductionService } from './production.service';
import { safeInt } from '../../hr/common/db-rows';

import { MS_PER_DAY } from '@common/constants/app.constants';
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

  constructor(
    private readonly svc: ProductionService,
    private readonly i18n: I18nService,
  ) {}

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

  @ApiOperation({ summary: 'Daily 3-timer dashboard (elapsed/remaining/not-started)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('timers-daily')
  async dailyTimers() {
    return unwrapOrThrow(await this.svc.getDailyTimers());
  }

  @ApiOperation({ summary: 'Order360 card' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('orders/:id/360-card')
  async order360Card(@Param('id') id: string) {
    const result = await this.svc.getOrder360Card(safeInt(id, 0));
    const card = unwrapOrThrow(result);
    if (!card) throw new NotFoundException(await this.i18n.t('errors.productionOrderNotFound'));
    return card;
  }

  @ApiOperation({ summary: 'Get production orders with pagination and stats (production_orders)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('orders')
  async getOrders(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    try {
      const lim = Math.min(parseInt(limit ?? '10', 10) || 10, 500);
      const pg = Math.max(parseInt(page ?? '1', 10) || 1, 1);
      const offset = (pg - 1) * lim;

      // Single query: paginated rows + total count
      const statusFilter = status && status !== 'all' ? sql`AND po.status = ${status}` : sql``;

      const countResult = await db.execute(sql`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::int AS completed,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)::int AS in_progress,
          SUM(CASE WHEN status IN ('in_progress','planned') AND planned_end_date::date < CURRENT_DATE THEN 1 ELSE 0 END)::int AS delayed
        FROM production_orders
        WHERE deleted_at IS NULL
        ${statusFilter}
      `);
      const countRow = (((countResult as Rows).rows) ?? [])[0] as {
        total: string; completed: number; in_progress: number; delayed: number;
      } | undefined;
      const total = parseInt(String(countRow?.total ?? '0'), 10);
      const pages = Math.max(1, Math.ceil(total / lim));

      const rowsResult = await db.execute(sql`
        SELECT
          po.id,
          po.order_number AS "orderNumber",
          po.product_name AS "productName",
          po.production_type AS "productionType",
          po.status,
          po.priority,
          po.planned_quantity AS "plannedQuantity",
          po.confirmed_quantity AS "confirmedQuantity",
          po.planned_cost AS "plannedCost",
          po.planned_start_date AS "plannedStartDate",
          po.planned_end_date AS "plannedEndDate",
          po.created_at AS "createdAt",
          COALESCE(u.full_name, (u.first_name || ' ' || u.last_name)) AS "responsibleName"
        FROM production_orders po
        LEFT JOIN users u ON u.id = po.responsible_manager_id
        WHERE po.deleted_at IS NULL
        ${statusFilter}
        ORDER BY po.created_at DESC
        LIMIT ${lim} OFFSET ${offset}
      `);
      const orders = ((rowsResult as Rows).rows) ?? [];

      return {
        orders,
        pagination: {
          total,
          page: pg,
          limit: lim,
          pages,
        },
        stats: {
          total,
          completed: countRow?.completed ?? 0,
          in_progress: countRow?.in_progress ?? 0,
          delayed: countRow?.delayed ?? 0,
        },
      };
    } catch (e) {
      this.logger.error('getOrders failed', e);
      throw new InternalServerErrorException(await this.i18n.t('errors.productionOrdersQueryFailed'));
    }
  }
}
