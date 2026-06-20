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

  @ApiOperation({ summary: 'Get warehouse transactions by date' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('orders-by-date/:date')
  @Roles(...WH_READ)
  async getOrdersByDate(@Param('date') date: string) {
    const r = await db.execute(sql`
      SELECT * FROM warehouse_transactions
      WHERE transaction_date = ${date}
      ORDER BY created_at DESC LIMIT 200
    `);
    const items = ((r as { rows?: unknown[] }).rows) ?? [];
    return { items, total: items.length };
  }
}
