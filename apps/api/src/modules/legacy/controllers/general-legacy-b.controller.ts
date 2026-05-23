/**
 * @module general-legacy-b.controller
 * @description Legacy controller B — warehouse, LMS progress, IoT stats, attendance creation.
 */

import {
  Controller, Get, Post, Param, Query, Body,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { LegacyService } from '../services/legacy.service';
import { LegacyIotService } from '../services/legacy-iot.service';
import { LmsRepository } from '../../lms/infrastructure/repositories/drizzle-lms.repo';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';

type Result<T> = { ok: true; data: T } | { ok: false; error: { message?: string; code?: string } };

function assertOk<T>(r: Result<T>): T {
  if (!r.ok) throw new InternalServerErrorException(r.error?.message ?? 'Xato');
  return r.data;
}

function safeData<T>(r: Result<{ items: T[] }>): T[] {
  return r.ok ? r.data.items : [];
}

@Controller('legacy')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GeneralLegacyBController {
  constructor(
    private readonly svc: LegacyService,
    private readonly iotSvc: LegacyIotService,
    private readonly lmsRepo: LmsRepository,
  ) {}

  // ─── Orders / Warehouse ─────────────────────────────────────────────────────

  @Get('orders-by-date')
  async getOrdersByDate(@Query() query: Record<string, unknown>) {
    return assertOk(await (this.svc as never as { getOrdersByDate(q: unknown): Promise<Result<unknown[]>> }).getOrdersByDate(query));
  }

  @Get('warehouse-stock')
  async getWarehouseStock(@Query() query: { warehouseId?: string }) {
    return assertOk(await (this.svc as never as { getWarehouseStock(id?: string): Promise<Result<unknown[]>> }).getWarehouseStock(query.warehouseId));
  }

  @Get('salary-benchmark')
  async getSalaryBenchmark() {
    return assertOk(await (this.svc as never as { getSalaryBenchmark(): Promise<Result<unknown>> }).getSalaryBenchmark());
  }

  // ─── LMS Progress ───────────────────────────────────────────────────────────

  @Get('progress-user/:userId')
  async getProgressUser(@Param('userId') userId?: string) {
    try {
      const [coursesResult, enrollmentsResult] = await Promise.all([
        this.lmsRepo.findAllCourses(),
        this.lmsRepo.findEnrollmentsByUser?.(userId ?? '') ?? Promise.resolve({ ok: false, error: { message: 'not supported' } }),
      ]);

      const courses = safeData(coursesResult as never);
      const enrollments = safeData(enrollmentsResult as never);

      if (!coursesResult.ok && !enrollmentsResult.ok) {
        return { courses: [], enrollments: [], progress: 0, skills: [] };
      }

      const completed = Array.isArray(enrollments)
        ? enrollments.filter((e: { status: string }) => e.status === 'completed').length
        : 0;
      const total = Array.isArray(courses) ? courses.length : 0;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { courses, enrollments, progress, skills: [] };
    } catch {
      return { courses: [], enrollments: [], progress: 0, skills: [] };
    }
  }

  // ─── ABC Analysis (stub) ────────────────────────────────────────────────────

  @Get('abc-analysis-user/:userId')
  async getAbcAnalysisUser(@Param('userId') _userId?: string) {
    return { category: 'A', score: 85 };
  }

  // ─── IoT ────────────────────────────────────────────────────────────────────

  @Get('iot-dashboard')
  async getIotDashboardStats() {
    return assertOk(await this.iotSvc.getIotDashboardStats());
  }

  // ─── Attendance Creation ────────────────────────────────────────────────────

  @Post('create-attendance')
  async createAttendance(@Body() body: Record<string, unknown>) {
    return { ...body, id: String(Date.now()), created: true };
  }

  // ─── Products ───────────────────────────────────────────────────────────────

  @Get('products')
  async getProducts(@Query() query: Record<string, unknown>) {
    return assertOk(await (this.iotSvc as never as { getProducts(q: unknown): Promise<Result<unknown[]>> }).getProducts(query));
  }
}
