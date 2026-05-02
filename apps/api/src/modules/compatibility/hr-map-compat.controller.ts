import { Controller, Get, Post, Query, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { HrMapCompatService } from './hr-map-compat.service';
import { CompatBodyDto } from './dto/compat-body.dto';
import { unwrapOrDefault, unwrapOrInternal } from '@common/http-result';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@Controller('hr-map')
export class HrMapCompatController {
  constructor(private readonly svc: HrMapCompatService) {}

  @Get('employees')
  async getMapEmployees(
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    return unwrapOrInternal(await this.svc.getMapEmployees(departmentId, status));
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
