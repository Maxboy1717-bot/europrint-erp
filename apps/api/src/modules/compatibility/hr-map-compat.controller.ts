/**
 * @module hr-map-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   hr-map module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import { Controller, Get, Post, Query, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { HrMapCompatService } from './hr-map-compat.service';
import { CompatBodyDto } from './dto/compat-body.dto';
import { unwrapOrDefault, unwrapOrInternal } from '@common/http-result';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@ApiThrottle()
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@Controller('hr-map')
export class HrMapCompatController {
  constructor(private readonly svc: HrMapCompatService) {}

  @Get('employees')
  async getMapEmployees(
    @Query('departmentId') departmentId?: string,
    @Query('orgDepartmentId') orgDepartmentId?: string,
    @Query('status') status?: string,
  ) {
    // Accept both 'departmentId' and 'orgDepartmentId' query params (FE uses orgDepartmentId)
    const deptId = departmentId ?? orgDepartmentId;
    return unwrapOrDefault(await this.svc.getMapEmployees(deptId, status), []);
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
    // Audit 2026-08-08: was `{ items, total }` — FE (TransportResult) reads the response
    // itself as `{groups, summary, factoryLat, factoryLng, generatedAt}`, so `groups` was
    // always undefined regardless of what the service computed. Return service data as-is.
    return unwrapOrDefault(
      await this.svc.getTransportGroups(),
      { groups: [], summary: '', factoryLat: 0, factoryLng: 0, generatedAt: new Date().toISOString() },
    );
  }

  @Get('stats')
  async getMapStats() {
    return unwrapOrDefault(
      await this.svc.getMapStats(),
      { total: { employees: 0 }, activeEmployees: 0, totalDepartments: 0, byDepartment: [] },
    );
  }

  @Get('zones')
  async getZones() {
    const r = await this.svc.getZones();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }
}
