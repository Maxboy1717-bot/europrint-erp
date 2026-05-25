/**
 * @module employee-kpi-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   employee-kpi module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { EmployeeKpiCompatService } from './employee-kpi-compat.service';
import { KpiBodyDto, AttendanceBodyDto } from './dto/hr.dto';
import { unwrapOrInternal } from '@common/http-result';
import {
  EmployeeKpiAclTranslator,
  type LegacyEmployeeKpiRow,
  type EmployeeKpiDto,
} from './acl/employee-kpi-acl';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@ApiThrottle()
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES, 'OPERATOR')
@Controller('employee-kpi')
export class EmployeeKpiCompatController {
  /** PA2-14 ACL translator. Stateless — direct instantiation is fine. */
  private readonly kpiAcl = new EmployeeKpiAclTranslator();

  constructor(private readonly svc: EmployeeKpiCompatService) {}

  @Get()
  async getKpis(
    @Query('employeeId') employeeId?: string,
    @Query('month') month?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrInternal(await this.svc.getKpis(employeeId, month, limit));
  }

  /**
   * PA2-14 ACL-translated variant of the daily KPI list. New BC-3 (HR /
   * Performance) consumers should target this route; `GET /employee-kpi`
   * stays for backwards-compat.
   */
  @Get('v2')
  async getKpisV2(
    @Query('employeeId') employeeId?: string,
    @Query('month') month?: string,
    @Query('limit') limit?: string,
  ): Promise<EmployeeKpiDto[]> {
    const rows = unwrapOrInternal(await this.svc.getKpis(employeeId, month, limit)) as unknown as LegacyEmployeeKpiRow[];
    const list = Array.isArray(rows) ? rows : [];
    return list
      .map((row) => this.kpiAcl.toDomain(row))
      .filter((r): r is { ok: true; data: EmployeeKpiDto } => r.ok)
      .map((r) => r.data);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createKpi(@Body() body: KpiBodyDto) {
    return unwrapOrInternal(await this.svc.createKpi(body));
  }

  @Get(['top-performers', 'summary/top-performers'])
  async getTopPerformers(
    @Query('limit') limit?: string,
    @Query('period') period?: string,
  ) {
    return unwrapOrInternal(await this.svc.getTopPerformers(limit, period));
  }

  @Get(['department-summary', 'summary/department'])
  async getDepartmentSummary(@Query('departmentId') departmentId?: string) {
    return unwrapOrInternal(await this.svc.getDepartmentSummary(departmentId));
  }

  @Get('zone-history/:employeeId')
  async getZoneHistory(
    @Param('employeeId') employeeId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return unwrapOrInternal(await this.svc.getZoneHistory(employeeId, from, to));
  }

  @Get('employee-zone-history')
  async getZoneHistoryLegacy(
    @Query('employeeId') employeeId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return unwrapOrInternal(await this.svc.getZoneHistory(employeeId, from, to));
  }

  @Get('daily-attendance')
  async getDailyAttendance(
    @Query('date') date?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return unwrapOrInternal(await this.svc.getDailyAttendance(date, departmentId));
  }

  @Post('attendance')
  @HttpCode(HttpStatus.CREATED)
  async recordAttendance(@Body() body: KpiBodyDto) {
    return unwrapOrInternal(await this.svc.recordAttendance(body));
  }

  @Get(':id')
  async getKpi(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getKpi(id));
  }

  @Put(':id')
  async updateKpi(@Param('id') id: string, @Body() body: KpiBodyDto) {
    return unwrapOrInternal(await this.svc.updateKpi(id, body));
  }

  @Delete(':id')
  async deleteKpi(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deleteKpi(id));
  }
}

@ApiThrottle()
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES, 'OPERATOR')
@Controller('employee-zone-history')
export class EmployeeZoneHistoryCompatController {
  constructor(private readonly svc: EmployeeKpiCompatService) {}

  @Get()
  async getZoneHistory(
    @Query('employeeId') employeeId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return unwrapOrInternal(await this.svc.getZoneHistory(employeeId, from, to));
  }

  @Get(':employeeId')
  async getZoneHistoryByParam(
    @Param('employeeId') employeeId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return unwrapOrInternal(await this.svc.getZoneHistory(employeeId, from, to));
  }
}

@ApiThrottle()
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES, 'OPERATOR')
@Controller('daily-attendance')
export class DailyAttendanceCompatController {
  constructor(private readonly svc: EmployeeKpiCompatService) {}

  @Get()
  async getDailyAttendance(
    @Query('date') date?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return unwrapOrInternal(await this.svc.getDailyAttendance(date, departmentId));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async recordAttendance(@Body() body: AttendanceBodyDto) {
    return unwrapOrInternal(await this.svc.recordAttendance(body));
  }
}
