/**
 * @module wms-catalog.controller
 * @description NestJS controller. HTTP route handlers; delegates to WmsCatalogService.
 */

import {
  Controller, Get, Logger, Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { WmsCatalogService } from '../application/wms-catalog.service';

const WH_READ = ['super_admin', 'warehouse_manager', 'warehouse_keeper', 'warehouse', 'director', 'ERP_MANAGER', 'admin', 'manager', 'accountant', 'finance'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouse')
export class WmsCatalogController {
  private readonly logger = new Logger(WmsCatalogController.name);

  constructor(private readonly catalogService: WmsCatalogService) {}

  // ── REPORTS ───────────────────────────────────────────────────────────────

  @Get('reports/abc-analysis')
  @Roles(...WH_READ)
  getReportsAbcAnalysis() {
    return this.catalogService.getAbcAnalysis();
  }

  @Get('reports/aging')
  @Roles(...WH_READ)
  getReportsAging(@Query('daysThreshold') daysThreshold?: string) {
    return this.catalogService.getAging(parseInt(daysThreshold ?? '90', 10));
  }

  @Get('reports/expiry')
  @Roles(...WH_READ)
  getReportsExpiry(
    @Query('days') days?: string,
    @Query('daysAhead') daysAheadQ?: string,
  ) {
    return this.catalogService.getExpiry(parseInt(daysAheadQ ?? days ?? '90', 10));
  }

  @Get('reports/stock-balance')
  @Roles(...WH_READ)
  getReportsStockBalance(
    @Query('warehouse_id') warehouseId?: string,
    @Query('category') category?: string,
    @Query('lowStockOnly') lowStockOnlyQ?: string,
  ) {
    return this.catalogService.getStockBalance(warehouseId, category, lowStockOnlyQ === 'true');
  }

  @Get('reports/turnover')
  @Roles(...WH_READ)
  getReportsTurnover() {
    return this.catalogService.getTurnover();
  }

  // ── STATS ─────────────────────────────────────────────────────────────────

  @Get('stats/total')
  @Roles(...WH_READ)
  getStatsTotal() {
    return this.catalogService.getStatsTotal();
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────────────

  @Get('dashboard')
  @Roles(...WH_READ)
  getDashboard() {
    return { totalItems: 0, lowStock: 0, pendingReceipts: 0, pendingTransfers: 0 };
  }

  @Get('dashboard/kpis')
  @Roles(...WH_READ)
  getDashboardKpis() {
    return this.catalogService.getDashboardKpis();
  }

  @Get('dashboard/movement-summary')
  @Roles(...WH_READ)
  getDashboardMovementSummary(@Query('period') period?: string) {
    return this.catalogService.getMovementSummary(period);
  }

  @Get('dashboard/alerts')
  @Roles(...WH_READ)
  getDashboardAlerts() {
    return this.catalogService.getDashboardAlerts();
  }

  @Get('dashboard/top-materials')
  @Roles(...WH_READ)
  getDashboardTopMaterials(
    @Query('by') _by?: string,
    @Query('limit') limit?: string,
  ) {
    return this.catalogService.getTopMaterials(parseInt(limit ?? '8', 10) || 8);
  }

  // ── MISC ──────────────────────────────────────────────────────────────────

  @Get('transactions')
  @Roles(...WH_READ)
  getTransactions() {
    return { data: [], total: 0 };
  }

  @Get('orders-by-date/:date')
  @Roles(...WH_READ)
  getOrdersByDate() {
    return { data: [], total: 0 };
  }
}
