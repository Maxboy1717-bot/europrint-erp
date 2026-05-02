import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
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
@Throttle({ default: { limit: 100, ttl: 60_000 } })
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
  @ApiOperation({ summary: 'Director dashboard — DirDashboard shape' })
  async getDashboard() {
    return unwrapOrInternal(await this.directorData.getDashboard());
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
  async getProductionSummary(){

      const today = _time.now();
      today.setHours(0, 0, 0, 0);
      const [activePoResult, completedTodayResult, avgOeeResult] = await Promise.all([
        this.queries.getActivePoCount(),
        this.queries.getCompletedTodayCount(today),
        this.queries.getAverageOee(),
      ]);
      return { data: {
        activePoCount: activePoResult.ok ? activePoResult.data : 0,
        completedToday: completedTodayResult.ok ? completedTodayResult.data : 0,
        avgOee: avgOeeResult.ok ? avgOeeResult.data : 0,
        generatedAt: _time.now(),
      }};
    
  }

  @Get('finance-summary')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Get finance summary for dashboard' })
  async getFinanceSummary(){

      const now = _time.now();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const [currentRevenueResult, lastMonthRevenueResult, topUnpaidResult, advancePendingResult] = await Promise.all([
        this.queries.getMonthlyRevenue(currentMonthStart),
        this.queries.getMonthlyRevenue(lastMonthStart, lastMonthEnd),
        this.queries.getTopUnpaidInvoices(),
        this.queries.getAdvancePending(),
      ]);
      const currentRevenue = currentRevenueResult.ok ? currentRevenueResult.data : 0;
      const lastMonthRevenue = lastMonthRevenueResult.ok ? lastMonthRevenueResult.data : 0;
      const revenueVsLastMonth = lastMonthRevenue > 0 ? Math.round(((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;
      return { data: {
        revenueVsLastMonth,
        topUnpaidInvoices: topUnpaidResult.ok ? topUnpaidResult.data : [],
        advancePending: advancePendingResult.ok ? advancePendingResult.data : 0,
        generatedAt: _time.now(),
      }};
    
  }

  @Get('hr-summary')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Get HR summary for dashboard' })
  async getHrSummary(){

      const today = _time.now();
      today.setHours(0, 0, 0, 0);
      const [attendanceTodayResult, openPayrollResult] = await Promise.all([
        this.queries.getAttendanceToday(today),
        this.queries.getOpenPayrollCount(),
      ]);
      return { data: {
        attendanceToday: attendanceTodayResult.ok ? attendanceTodayResult.data : { attended: 0, total: 0 },
        openPayrollCount: openPayrollResult.ok ? openPayrollResult.data : 0,
        generatedAt: _time.now(),
      }};
    
  }
}
