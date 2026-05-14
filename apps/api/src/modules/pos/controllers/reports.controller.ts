/**
 * POS — Reports Controller
 */
import { UseInterceptors } from '@nestjs/common';
import { throwFromError, unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import {Controller, Get, Query, UseGuards, Logger} from '@nestjs/common';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';

import { PosAuditService } from '../services/pos-audit.service';
import { PosReportsService } from '../services/pos-reports.service';

@ApiTags('POS — Hisobotlar')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('pos/reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);
  constructor(
    private readonly auditService: PosAuditService,
    private readonly reportsService: PosReportsService,
  ) {}

  @Get('kpi')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'KPI Dashboard — real-time ko\'rsatkichlar' })
  async getKpi() {
    return unwrapOrThrow(await this.reportsService.getKpi());
  }

  @Get('stock')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Joriy stock holati (ombor bo\'yicha)' })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'category', required: false })
  async getStockReport(
    @Query('warehouseId') warehouseId?: string,
    @Query('category') category?: string,
  ) {
    return unwrapOrThrow(await this.reportsService.getStockReport(warehouseId, category));
  }

  @Get('movement-stats')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Harakat statistikasi' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month'], required: false })
  async getMovementStats(@Query('period') period: 'day' | 'week' | 'month' = 'month') {
    return unwrapOrThrow(await this.reportsService.getMovementStats(period));
  }

  @Get('top-materials')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Eng ko\'p chiqarilgan 20 ta material (so\'nggi 30 kun)' })
  async getTopMaterials() {
    return unwrapOrThrow(await this.reportsService.getTopMaterials());
  }

  @Get('audit')
  @RequirePermission('pos.audit.read')
  @ApiOperation({ summary: 'Audit log' })
  async getAuditLog(
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrInternal(await this.auditService.getAuditLog({
      userId: userId ? parseInt(userId) : undefined,
      entityType: entityType ?? undefined,
      entityId: entityId ? parseInt(entityId) : undefined,
      action: action ?? undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    }));
  }

  @Get('three-way-match')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'PO + GR + Invoice mos kelmaydigan harakatlar' })
  async getThreeWayMismatch() {
    return unwrapOrThrow(await this.reportsService.getThreeWayMismatch());
  }

  @Get('liabilities')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'Barcha ochiq moddiy javobgarlik ishlari' })
  async getLiabilityReport() {
    return unwrapOrThrow(await this.reportsService.getLiabilityReport());
  }

  @Get('abc-analysis')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'ABC tahlil — materiallarni qiymat bo\'yicha A/B/C sinflashtirish (Pareto 80/95/100)' })
  @ApiQuery({ name: 'warehouseId', required: false, description: 'Ombor bo\'yicha filtr' })
  async getAbcAnalysis(@Query('warehouseId') warehouseId?: string) {
    return unwrapOrThrow(await this.reportsService.getAbcAnalysis(warehouseId));
  }

  @Get('inactive-materials')
  @RequirePermission('pos.reports.read')
  @ApiOperation({ summary: 'N kundan beri harakatsiz materiallar (minimal qoldiq bilan)' })
  @ApiQuery({ name: 'days', required: false, description: 'Harakatsizlik kunlari (default: 90)' })
  @ApiQuery({ name: 'warehouseId', required: false })
  async getInactiveMaterials(
    @Query('days') days?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    const inactiveDays = days ? parseInt(days, 10) : 90;
    return unwrapOrThrow(await this.reportsService.getInactiveMaterials(inactiveDays, warehouseId));
  }
}
