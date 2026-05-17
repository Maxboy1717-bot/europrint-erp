/**
 * @module hr-map-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Query, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { HrMapCompatService } from './hr-map-compat.service';
import { CompatBodyDto } from './dto/compat-body.dto';
import { unwrapOrDefault, unwrapOrInternal } from '@common/http-result';
import {
  HrMapEmployeeAclTranslator,
  type LegacyHrMapEmployeeRow,
  type HrMapEmployeeDto,
} from './acl/hr-map-employee-acl';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@ApiThrottle()
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@Controller('hr-map')
export class HrMapCompatController {
  /** PA2-14 ACL translator. Stateless — direct instantiation is fine. */
  private readonly empAcl = new HrMapEmployeeAclTranslator();

  constructor(private readonly svc: HrMapCompatService) {}

  @Get('employees')
  async getMapEmployees(
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    return unwrapOrInternal(await this.svc.getMapEmployees(departmentId, status));
  }

  /**
   * PA2-14 ACL-translated variant of hr-map employees. New BC-3 (HR / Map)
   * consumers should target this route; `/employees` stays for
   * backwards-compat.
   */
  @Get('employees/v2')
  async getMapEmployeesV2(
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ): Promise<HrMapEmployeeDto[]> {
    const rows = unwrapOrInternal(await this.svc.getMapEmployees(departmentId, status)) as unknown as LegacyHrMapEmployeeRow[];
    const list = Array.isArray(rows) ? rows : [];
    return list
      .map((row) => this.empAcl.toDomain(row))
      .filter((r): r is { ok: true; data: HrMapEmployeeDto } => r.ok)
      .map((r) => r.data);
  }

  @Get('departments')
  async getDepartments() {
    return unwrapOrInternal(await this.svc.getDepartments());
  }

  @Get('heatmap')
  async getHeatmap(@Query('metric') metric?: string) {
    return unwrapOrInternal(await this.svc.getHeatmap(metric));
  }

  @Get('attendance-today')
  async getAttendanceToday() {
    return unwrapOrInternal(await this.svc.getAttendanceToday());
  }

  @Post('filter')
  async filterMap(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.filterMap(body));
  }

  @Get('transport-groups')
  async getTransportGroups() {
    const r = await this.svc.getTransportGroups();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get('stats')
  async getMapStats() {
    const r = await this.svc.getMapStats();
    return unwrapOrDefault(r, { totalEmployees: 0, activeEmployees: 0, totalDepartments: 0, byDepartment: [] });
    return r.data;
  }

  @Get('zones')
  async getZones() {
    const r = await this.svc.getZones();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }
}
