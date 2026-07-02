/**
 * @module wms-catalog.controller
 * @description NestJS controller. HTTP route handlers; delegates to WmsCatalogService.
 */

import {
  Controller, Get, HttpException, HttpStatus, Logger, Param, Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { WmsCatalogService } from '../application/wms-catalog.service';
import { notImplemented } from '@common/exceptions/not-implemented';

// P3-26: throw 501 instead of fake empty payloads so frontend can show
const WH_READ = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'warehouse', 'director', 'ERP_MANAGER', 'admin', 'manager', 'accountant', 'finance'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Wms Catalog')
@ApiBearerAuth()
@Controller('warehouse')
export class WmsCatalogController {
  private readonly logger = new Logger(WmsCatalogController.name);

  constructor(private readonly catalogService: WmsCatalogService) {}

  // -- REPORTS ---------------------------------------------------------------

  @ApiOperation({ summary: 'Get reports abc analysis' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('reports/abc-analysis')
  @Roles(...WH_READ)
  getReportsAbcAnalysis() {
    return this.catalogService.getAbcAnalysis();
  }

  @ApiOperation({ summary: 'Get reports aging' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('reports/aging')
  @Roles(...WH_READ)
  getReportsAging(@Query('daysThreshold') daysThreshold?: string) {
    return this.catalogService.getAging(parseInt(daysThreshold ?? '90', 10));
  }

  @ApiOperation({ summary: 'Get reports expiry' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('reports/expiry')
  @Roles(...WH_READ)
  getReportsExpiry(
    @Query('days') days?: string,
    @Query('daysAhead') daysAheadQ?: string,
  ) {
    return this.catalogService.getExpiry(parseInt(daysAheadQ ?? days ?? '90', 10));
  }

  @ApiOperation({ summary: 'Get reports stock balance' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('reports/stock-balance')
  @Roles(...WH_READ)
  getReportsStockBalance(
    @Query('warehouse_id') warehouseId?: string,
    @Query('category') category?: string,
    @Query('lowStockOnly') lowStockOnlyQ?: string,
  ) {
    return this.catalogService.getStockBalance(warehouseId, category, lowStockOnlyQ === 'true');
  }

  @ApiOperation({ summary: 'Get reports turnover' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('reports/turnover')
  @Roles(...WH_READ)
  getReportsTurnover(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.catalogService.getTurnover(dateFrom, dateTo);
  }

  // -- STATS -----------------------------------------------------------------

  @ApiOperation({ summary: 'Get stats total' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stats/total')
  @Roles(...WH_READ)
  getStatsTotal() {
    return this.catalogService.getStatsTotal();
  }

  // -- DASHBOARD -------------------------------------------------------------

  @ApiOperation({ summary: 'Get dashboard' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard')
  @Roles(...WH_READ)
  async getDashboard() {
    const kpis = await this.catalogService.getDashboardKpis();
    return {
      totalItems: kpis.totalMaterials,
      lowStock: kpis.lowStockCount,
      pendingReceipts: kpis.pendingReceipts,
      pendingTransfers: kpis.pendingTransfers,
      totalMaterials: kpis.totalMaterials,
      totalValue: kpis.totalValue,
      lowStockCount: kpis.lowStockCount,
      overdueReservations: kpis.overdueReservations,
    };
  }

  @ApiOperation({ summary: 'Get dashboard kpis' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard/kpis')
  @Roles(...WH_READ)
  getDashboardKpis() {
    return this.catalogService.getDashboardKpis();
  }

  @ApiOperation({ summary: 'Get dashboard movement summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard/movement-summary')
  @Roles(...WH_READ)
  getDashboardMovementSummary(@Query('period') period?: string) {
    return this.catalogService.getMovementSummary(period);
  }

  @ApiOperation({ summary: 'Get dashboard alerts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard/alerts')
  @Roles(...WH_READ)
  getDashboardAlerts() {
    return this.catalogService.getDashboardAlerts();
  }

  @ApiOperation({ summary: 'Get dashboard top materials' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard/top-materials')
  @Roles(...WH_READ)
  getDashboardTopMaterials(
    @Query('by') _by?: string,
    @Query('limit') limit?: string,
  ) {
    return this.catalogService.getTopMaterials(parseInt(limit ?? '8', 10) || 8);
  }

  // -- MISC ------------------------------------------------------------------

  @ApiOperation({ summary: 'Get warehouse transactions' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('transactions')
  @Roles(...WH_READ)
  async getTransactions(@Query('limit') limit?: string) {
    const lim = Math.min(parseInt(limit ?? '100', 10) || 100, 500);
    const r = await db.execute(sql`
      SELECT * FROM warehouse_transactions ORDER BY created_at DESC LIMIT ${lim}
    `);
    const items = ((r as { rows?: unknown[] }).rows) ?? [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Get production orders with material kits by plan date' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('orders-by-date/:date')
  @Roles(...WH_READ)
  async getOrdersByDate(@Param('date') date: string) {
    // NOTE: complex LEFT JOIN + json_agg — Drizzle does not support json_agg natively.
    // Migrated off the legacy `papka_orders` side-table (0 live rows, outside the
    // canonical golden-thread event chain) onto `production_orders` (canonical PP
    // table, populated by SD->PP listener / POST /pp/orders). `products`/`sales_orders`
    // are joined for display fields production_orders itself doesn't carry
    // (product name/category, customer name). material_kits.order_id has no live FK
    // (verified via pg_constraint) and is a plain integer column, so it now keys off
    // production_orders.id instead of the dead papka_orders.id — no data migration
    // needed since both source tables are currently empty in production.
    const r = await db.execute(sql`
      SELECT
        po.id,
        po.order_number                            AS "papkaNo",
        so.customer_name                           AS "mijozNomi",
        COALESCE(po.product_name, pr.name)         AS "mahsulotNomi",
        COALESCE(po.quantity, po.planned_quantity) AS "tiraj",
        NULL::numeric                              AS "formatA",
        NULL::numeric                              AS "formatB",
        pr.category                                AS "mahsulotTuri",
        po.status,
        COALESCE(
          json_agg(
            json_build_object(
              'id',            mk.id,
              'kitNumber',     mk.kit_number,
              'orderId',       mk.order_id,
              'status',        mk.status,
              'barcode',       mk.barcode,
              'scheduledDate', mk.scheduled_date,
              'scheduledTime', mk.scheduled_time,
              'preparedBy',    mk.prepared_by,
              'preparedAt',    mk.prepared_at,
              'deliveredBy',   mk.delivered_by,
              'deliveredAt',   mk.delivered_at,
              'createdAt',     mk.created_at
            ) ORDER BY mk.id
          ) FILTER (WHERE mk.id IS NOT NULL),
          '[]'::json
        ) AS kits
      FROM production_orders po
      LEFT JOIN products pr
        ON pr.id = po.product_id
      LEFT JOIN sales_orders so
        ON so.id = po.sales_order_id
      LEFT JOIN material_kits mk
        ON mk.order_id = po.id
        AND mk.deleted_at IS NULL
      WHERE po.deleted_at IS NULL
        AND po.planned_start_date = ${date}
      GROUP BY po.id, so.customer_name, pr.name, pr.category
      ORDER BY po.id
    `);
    const rows = ((r as { rows?: unknown[] }).rows) ?? [];
    return { items: rows, total: rows.length };
  }
}
