import { DEFAULT_PAGE_SIZE } from '@common/constants/app.constants';
import { assertOk, unwrapOrInternal } from '@common/http-result';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {Controller,
  Get,
  Query, Logger, UseGuards, UseInterceptors} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { LegacyService } from '../services/legacy.service';
import { LegacyIotService } from '../services/legacy-iot.service';
import { LmsRepository } from '../../lms/infrastructure/repositories/drizzle-lms.repo';

const ALL_ROLES = ['admin', 'super_admin', 'manager', 'director', 'hr_manager', 'employee', 'warehouse', 'warehouse_manager', 'accountant', 'finance'] as const;

@ApiTags('General Legacy Routes B')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...ALL_ROLES)
@Controller()
export class GeneralLegacyBController {
  private readonly logger = new Logger(GeneralLegacyBController.name);
  constructor(
    private readonly svc: LegacyService,
    private readonly iotSvc: LegacyIotService,
    private readonly lmsRepo: LmsRepository,
  ) {}

  // ─── Warehouse ─────────────────────────────────────────────────────────
  @Get('warehouse/orders-by-date')
  async getOrdersByDate(@Query() _query: Record<string, string | undefined>) {
    return unwrapOrInternal(await this.svc.getOrdersByDate());
  }

  @Get('warehouse/warehouses')
  async getWarehouseList() {
    return unwrapOrInternal(await this.svc.getWarehouseList());
  }

  @Get('warehouse/stock')
  async getWarehouseStock(@Query() query: Record<string, string | undefined>) {
    return unwrapOrInternal(await this.svc.getWarehouseStock(query.warehouseId));
  }

  @Get('warehouse/transfers')
  async getWarehouseTransfers(@Query() _query: Record<string, string | undefined>) {
    return unwrapOrInternal(await this.svc.getWarehouseTransfers());
  }

  @Get('warehouse/lots')
  async getWarehouseLots(@Query() _query: Record<string, string | undefined>) {
    return unwrapOrInternal(await this.svc.getWarehouseLots());
  }

  @Get('warehouse/internal-requests')
  async getWarehouseInternalRequests(@Query() _query: Record<string, string | undefined>) {
    return unwrapOrInternal(await this.svc.getWarehouseInternalRequests());
  }

  @Get('warehouse/dashboard/kpis')
  async getWarehouseDashboardKpis() {
    return unwrapOrInternal(await this.svc.getWarehouseDashboardKpis());
  }

  @Get('warehouse/dashboard/warehouse-occupancy')
  async getWarehouseOccupancy() {
    return unwrapOrInternal(await this.svc.getWarehouseOccupancy());
  }

  // ─── Finance ───────────────────────────────────────────────────────────
  @Get('finance/salary-benchmark')
  async getSalaryBenchmark() {
    return unwrapOrInternal(await this.svc.getSalaryBenchmark());
  }

  // ─── User Progress / Skills ─────────────────────────────────────────────
  @Get('progress/user')
  async getProgressUser(@Query('employee_id') empId?: string) {
    const userId = empId ?? '0';
    const [coursesResult, enrollmentsResult] = await Promise.all([
      this.lmsRepo.findAllCourses({ limit: DEFAULT_PAGE_SIZE }),
      this.lmsRepo.findEnrollmentsByUser(userId, { limit: DEFAULT_PAGE_SIZE }),
    ]);
    const courses = coursesResult.ok && Array.isArray(coursesResult.data?.items) ? coursesResult.data.items : [];
    const enrollments = enrollmentsResult.ok && Array.isArray(enrollmentsResult.data?.items) ? enrollmentsResult.data.items : [];
    const completedCount = (Array.isArray(enrollments) ? enrollments : []).filter((e) => e.status === 'completed').length;
    const progress = enrollments.length > 0 ? Math.round((completedCount / enrollments.length) * 100) : 0;
    return { courses, enrollments, progress, skills: [] };
  }

  @Get('certificates/user')
  async getCertificatesUser(@Query('employee_id') empId?: string) {
    return unwrapOrInternal(await this.svc.getCertificatesUser(empId));
  }

  @Get('safety-violations/user')
  async getSafetyViolationsUser(@Query('employee_id') empId?: string) {
    return unwrapOrInternal(await this.svc.getSafetyViolationsUser(empId));
  }

  @Get('abc-analysis/user')
  async getAbcAnalysisUser(@Query('employee_id') _empId?: string) {
    return { category: 'A', score: 85 };
  }

  @Get('discipline/user')
  async getDisciplineUser(@Query('employee_id') empId?: string) {
    return unwrapOrInternal(await this.svc.getDisciplineUser(empId));
  }

  // ─── IoT Dashboard Routes ─────────────────────────────────────────────────
  @Get('iot/dashboard/stats')
  async getIotDashboardStats() {
    const r = await this.iotSvc.getIotDashboardStats();
    assertOk(r);
    return r.data;
  }

  @Get('iot/production-sessions')
  async getIotProductionSessions(@Query() _query: Record<string, string | undefined>) {
    return unwrapOrInternal(await this.iotSvc.getIotProductionSessions());
  }

  @Get('iot/downtime-events')
  async getIotDowntimeEvents(@Query() _query: Record<string, string | undefined>) {
    return unwrapOrInternal(await this.iotSvc.getIotDowntimeEvents());
  }

  @Get('iot/tablet/defect-reasons')
  async getIotTabletDefectReasons() {
    return unwrapOrInternal(await this.iotSvc.getIotTabletDefectReasons());
  }

  // ─── Production Orders Report ─────────────────────────────────────────────
  @Get('production/orders/report')
  async getProductionOrdersReport(@Query() _query: Record<string, string | undefined>) {
    return unwrapOrInternal(await this.iotSvc.getProductionOrdersReport());
  }

  // ─── PP (Production Planning) Routes ─────────────────────────────────────
  @Get('pp/production-orders')
  async getPpProductionOrders(@Query() _query: Record<string, string | undefined>) {
    return unwrapOrInternal(await this.iotSvc.getPpProductionOrders());
  }

  // ─── Products (top-level) ─────────────────────────────────────────────────
  @Get('products')
  async getProducts(@Query() _query: Record<string, string | undefined>) {
    return unwrapOrInternal(await this.iotSvc.getProducts());
  }

  // ─── Technology Cards ─────────────────────────────────────────────────────
  @Get('technology-cards')
  async getTechnologyCards(@Query() _query: Record<string, string | undefined>) {
    return unwrapOrInternal(await this.iotSvc.getTechnologyCards());
  }
}
