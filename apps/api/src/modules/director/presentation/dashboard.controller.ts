/**
 * @module dashboard.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { I18nService } from 'nestjs-i18n';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { unwrapOrInternal, throwFromError, unwrapOrThrow } from '@common/http-result';
import { GetDashboardKpisQuery } from '../application/queries/get-dashboard-kpis.query';
import { DashboardQueryService } from '../application/dashboard-query.service';
import { DirectorDataService } from '../application/director-data.service';

interface DashboardKpis {
  salesOrders: number;
  revenue: number;
  pendingApprovals: number;
  activeProduction: number;
  qcPassRate: number;
  lowStockCount: number;
  generatedAt: Date;
  stats?: { pendingToday: number; approvedToday: number; rejectedToday: number; avgApprovalTimeHours: number };
}
interface ProductionSummary { activePoCount: number; completedToday: number; avgOee: number; generatedAt: Date }
interface FinanceSummary { revenueVsLastMonth: number; topUnpaidInvoices: Array<{ invoiceId: string; amount: number; daysOverdue: number }>; advancePending: number; generatedAt: Date }
interface HrSummary { attendanceToday: { attended: number; total: number }; openPayrollCount: number; generatedAt: Date }

@ApiTags('Director — Dashboard')
@ApiBearerAuth()
@ApiThrottle()
@Controller('director/dashboard')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly queries: DashboardQueryService,
    private readonly directorData: DirectorDataService,
    private readonly i18n: I18nService,
  ) {}

  @Get('')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Director dashboard — DirDashboard shape (P30: mode + widgets)' })
  async getDashboard(@Query('mode') mode?: string) {
    // P30 EP-DIR-025/053: ?mode=snapshot (07:00 muzlatilgan) | realtime (joriy).
    const isSnapshot = mode === 'snapshot';
    const [base, planFact, orderProgress, statTrends, openIssues] = await Promise.all([
      this.directorData.getDashboard(),
      this.queries.getPlanFact(),
      this.queries.getOrderProgress(),
      this.queries.getStatTrends(),
      this.queries.getOpenIssues(),
    ]);
    const baseData = (base.ok ? base.data : {}) as Record<string, unknown>;
    return {
      ...baseData,
      criticalStock: (baseData as { alerts?: { minStock?: number } }).alerts?.minStock ?? 0,
      mode:          isSnapshot ? 'snapshot' : 'realtime',
      planFact:      Array.isArray(planFact) ? planFact : [],
      orderProgress: Array.isArray(orderProgress) ? orderProgress : [],
      statTrends:    Array.isArray(statTrends) ? statTrends : [],
      openIssues:    Array.isArray(openIssues) ? openIssues : [],
      // EP-DIR-026 (kunlik AI tahlilchi) — to'liq P35/P36 (AI) ga deferred.
      aiInsights:    [],
    };
  }

  @Get('plan-fact')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Plan vs fact by department (today)' })
  async getPlanFact() {
    return { data: await this.queries.getPlanFact() };
  }

  @Get('order-progress')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Order readiness progress' })
  async getOrderProgress() {
    return { data: await this.queries.getOrderProgress() };
  }

  @Get('order-cycle-time')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Order cycle-time — elapsed/remaining days vs planned (reja vs fakt)' })
  async getOrderCycleTime() {
    return { data: await this.queries.getOrderCycleTime() };
  }

  @Get('stat-trends')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Stat-regulation trend skeleton' })
  async getStatTrends() {
    return { data: await this.queries.getStatTrends() };
  }

  @Get('open-issues')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: "Today's unresolved diary issues" })
  async getOpenIssues() {
    return { data: await this.queries.getOpenIssues() };
  }

  @Get('setup-loss')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER)
  @ApiOperation({ summary: "Priladka/setup vaqti sozlash-yo'qotish panel (EP-DIR-064)" })
  async getSetupLoss() {
    return { data: await this.queries.getSetupLoss() };
  }

  @Get('plan-deviation-counts')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Delay count + plan-deviation count (raw; reason breakdown owner-gated)' })
  async getPlanDeviationCounts() {
    return { data: await this.queries.getPlanDeviationCounts() };
  }

  @Get('kpis')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Get director dashboard KPIs' })
  async getKpis() {
    return unwrapOrThrow(await this.queryBus.execute(new GetDashboardKpisQuery()));
  }

  @Get('production-summary')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER)
  @ApiOperation({ summary: 'Get production summary for dashboard' })
  async getProductionSummary() {
    return { data: await this.queries.getProductionSummary() };
  }

  @Get('finance-summary')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Get finance summary for dashboard' })
  async getFinanceSummary() {
    return { data: await this.queries.getFinanceSummary() };
  }

  @Get('hr-summary')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Get HR summary for dashboard' })
  async getHrSummary() {
    return { data: await this.queries.getHrSummary() };
  }

  // ─── KPI Definitions config (threshold owner-config) ────────────────────────

  private static readonly UpdateKpiThresholdSchema = z.object({
    target_value:       z.number().positive().optional(),
    warning_threshold:  z.number().positive().optional(),
    critical_threshold: z.number().positive().optional(),
  });

  @Get('kpi-definitions')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'List KPI threshold definitions (config-mexanizm)' })
  async getKpiDefinitions() {
    const rows = await rawSql(sql`
      SELECT id, kpi_code, kpi_name, category, unit,
             target_value, warning_threshold, critical_threshold, threshold_direction, is_active
      FROM kpi_definitions
      ORDER BY id
    `);
    return rows.rows;
  }

  @Patch('kpi-definitions/:id')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Update KPI threshold values (config-mexanizm)' })
  async updateKpiDefinition(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = DashboardController.UpdateKpiThresholdSchema.parse(body);
    const rows = await rawSql(sql`
      UPDATE kpi_definitions SET
        target_value       = COALESCE(${dto.target_value       ?? null}::numeric, target_value),
        warning_threshold  = COALESCE(${dto.warning_threshold  ?? null}::numeric, warning_threshold),
        critical_threshold = COALESCE(${dto.critical_threshold ?? null}::numeric, critical_threshold)
      WHERE id = ${id}
      RETURNING id, kpi_code, kpi_name, target_value, warning_threshold, critical_threshold
    `);
    const result = rows.rows[0] ?? undefined;
    if (!result) throw new BadRequestException(await this.i18n.t('errors.kpiDefinitionNotFoundWithId', { args: { id } }));
    return result;
  }

  // ─── STKP vazn config (KPI score weights) ────────────────────────────────────

  private static readonly UpdateKpiWeightSchema = z.object({
    weight: z.number().min(0.01).max(1.0),
  });

  @Get('kpi-weights')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
  @ApiOperation({ summary: 'List KPI score weights (config-mexanizm: attendance/performance/tasks)' })
  async getKpiWeights() {
    const rows = await rawSql(sql`
      SELECT id, code, label_uz, weight, updated_at
      FROM kpi_score_weights
      ORDER BY id
    `);
    return { items: rows.rows };
  }

  @Patch('kpi-weights/:code')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Update one KPI score weight by code (config-mexanizm)' })
  async updateKpiWeight(
    @Param('code') code: string,
    @Body() body: unknown,
  ) {
    const dto = DashboardController.UpdateKpiWeightSchema.parse(body);
    const rows = await rawSql(sql`
      UPDATE kpi_score_weights
      SET weight = ${dto.weight}, updated_at = NOW()
      WHERE code = ${code}
      RETURNING id, code, label_uz, weight
    `);
    const result = rows.rows[0] ?? undefined;
    if (!result) throw new BadRequestException(await this.i18n.t('errors.kpiScoreWeightNotFoundWithCode', { args: { code } }));
    return result;
  }
}
