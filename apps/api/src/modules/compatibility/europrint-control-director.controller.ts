/**
 * @module europrint-control-director.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, HttpCode, Param, Post, Query, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { EuroprintControlDirectorService } from './europrint-control-director.service';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('EuroPrint Control Center (Director)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('europrint-control')
export class EuroprintControlDirectorController {
  constructor(private readonly svc: EuroprintControlDirectorService) {}

  @Get('director-kpis')
  async getDirectorKpis() {
    return unwrapOrInternal(await this.svc.getDirectorKpis());
  }

  @Get('director-summary')
  async getDirectorSummary() {
    const r = await this.svc.getDirectorSummary();
    return r.ok ? r.data : { summary: 'N/A', alerts: [], lastUpdated: _time.now() };
  }

  @Get('status-history')
  async getStatusHistory(
    @Query('entity') _entity?: string,
    @Query('entityId') _entityId?: string,
  ) {
    const r = await this.svc.getStatusHistory();
    return Array.isArray(r.ok ? r.data : null) ? r.data : [];
  }

  @Get('deleted-records')
  async getDeletedRecords() {
    return unwrapOrInternal(await this.svc.getDeletedRecords());
  }

  @Get('accountant/budgets')
  async getAccountantBudgets() {
    return unwrapOrInternal(await this.svc.getAccountantBudgets());
  }

  @Get('accountant/financial-summary')
  async getAccountantFinancialSummary() {
    const r = await this.svc.getAccountantFinancialSummary();
    return r.ok ? r.data : { revenue: 0, expenses: 0, profit: 0, cashFlow: 0 };
  }

  @Get('accountant/kpi-values')
  async getAccountantKpiValues() {
    const r = await this.svc.getAccountantKpiValues();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get('accountant/pending-payments')
  async getAccountantPendingPayments() {
    return unwrapOrInternal(await this.svc.getAccountantPendingPayments());
  }

  @Get('dashboard/accountant')
  async getAccountantDashboard() {
    const r = await this.svc.getAccountantDashboard();
    return r.ok ? r.data : { summary: {}, alerts: [], lastUpdated: _time.now() };
  }

  @Post('deleted-records/:id/restore')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'manager', 'director', 'super_admin')
  async restoreDeletedRecord(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.restoreDeletedRecord(id));
  }

  /**
   * AuditorPanel page calls GET /api/europrint-control/menus/admin to fetch
   * the admin-only menu structure. Real implementation: query rbac_menus
   * filtered by admin role. Until that's wired, return an empty menu tree
   * so the page renders without 404.
   */
  @Get('menus/admin')
  async getAdminMenus() {
    return { items: [], generatedAt: _time.now().toISOString() };
  }
}
