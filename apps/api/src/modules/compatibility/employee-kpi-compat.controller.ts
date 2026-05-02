import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { EmployeeKpiCompatService } from './employee-kpi-compat.service';
import { KpiBodyDto, AttendanceBodyDto } from './dto/hr.dto';
import { unwrapOrInternal } from '@common/http-result';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES, 'OPERATOR')
@Controller('employee-kpi')
export class EmployeeKpiCompatController {
  constructor(private readonly svc: EmployeeKpiCompatService) {}

  @Get()
  async getKpis(
    @Query('employeeId') employeeId?: string,
    @Query('month') month?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrInternal(await this.svc.getKpis(employeeId, month, limit));
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

@Throttle({ default: { limit: 100, ttl: 60_000 } })
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

@Throttle({ default: { limit: 100, ttl: 60_000 } })
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
