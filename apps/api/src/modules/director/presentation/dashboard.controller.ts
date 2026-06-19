/**
 * @module dashboard.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Query, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
}
