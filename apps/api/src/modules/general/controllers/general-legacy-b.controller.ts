/**
 * @module general-legacy-b.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { DEFAULT_PAGE_SIZE } from '@common/constants/app.constants';
import { assertOk, unwrapOrInternal } from '@common/http-result';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {Body, Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query, Logger, UseGuards, UseInterceptors} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { LegacyService } from '../services/legacy.service';
import { LegacyIotService } from '../services/legacy-iot.service';
import { LmsRepository } from '../../lms/infrastructure/repositories/drizzle-lms.repo';
import {
  getAbcAnalysisForUserRaw,
  getCourseProgressForUserRaw,
} from '../services/legacy-kpi.helpers';

import { z } from 'zod';

const CreateAttendanceSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
  date: z.string().optional(),
  status: z.string().max(50).optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
}).passthrough();

const ALL_ROLES = ['admin', 'super_admin', 'manager', 'director', 'hr_manager', 'employee', 'warehouse', 'warehouse_manager', 'accountant', 'finance'] as const;

@ApiTags('General Legacy Routes B')
@ApiThrottle()
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
  // NOTE: GET warehouse/orders-by-date/:date handled by WmsCatalogController (real papka_orders JOIN material_kits query)
  // Route warehouse/warehouses moved to WmsWarehouseGatewayController (real DB implementation)

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

  // Route warehouse/dashboard/kpis moved to WmsWarehouseGatewayController (real DB implementation)

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
    const [coursesResult, enrollmentsResult, courseProgress] = await Promise.all([
      this.lmsRepo.findAllCourses({ limit: DEFAULT_PAGE_SIZE }),
      this.lmsRepo.findEnrollmentsByUser(userId, { limit: DEFAULT_PAGE_SIZE }),
      getCourseProgressForUserRaw(userId).catch(() => []),
    ]);
    const courses = coursesResult.ok && Array.isArray(coursesResult.data?.items) ? coursesResult.data.items : [];
    const enrollments = enrollmentsResult.ok && Array.isArray(enrollmentsResult.data?.items) ? enrollmentsResult.data.items : [];
    const completedCount = (Array.isArray(enrollments) ? enrollments : []).filter((e) => e.status === 'completed').length;
    const progress = enrollments.length > 0 ? Math.round((completedCount / enrollments.length) * 100) : 0;
    // skills = course progress rows (real DB data from enrollments + courses JOIN)
    const skills = Array.isArray(courseProgress) ? courseProgress : [];
    return { courses, enrollments, progress, skills };
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
  async getAbcAnalysisUser(@Query('employee_id') empId?: string) {
    if (!empId) {
      return { grade: 'N/A', score: 0, performanceRate: 0, punctualityRate: 0, attendanceRate: 0, courseCompletionRate: 0, error: 'employee_id required' };
    }
    try {
      return await getAbcAnalysisForUserRaw(empId);
    } catch (e) {
      this.logger.error('ABC analysis error', e);
      return { grade: 'C', score: 0, performanceRate: 0, punctualityRate: 0, attendanceRate: 0, courseCompletionRate: 0, error: String(e) };
    }
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

  // ProductionReport page expects an Excel download endpoint. Until the real
  // XLSX generator is in place we serve a JSON descriptor that the page can
  // surface as "report not yet ready" without 404'ing.
  @Get('production/orders/report/excel')
  async getProductionOrdersReportExcel(@Query() _query: Record<string, string | undefined>) {
    return {
      ready:        false,
      url:          null,
      generated_at: null,
      reason:       'Excel eksport hali tayyor emas — JSON hisoboti /production/orders/report orqali mavjud',
    };
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

  @Post('attendance')
  @HttpCode(HttpStatus.CREATED)
  async createAttendance(@Body() body: unknown) {
    const dto = CreateAttendanceSchema.parse(body);
    return unwrapOrInternal(await this.svc.createAttendance(dto));
  }
}
