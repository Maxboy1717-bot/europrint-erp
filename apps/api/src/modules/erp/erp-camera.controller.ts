/**
 * @module erp-camera.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ErpCameraService } from './erp-camera.service';
import { safeInt } from '../hr/common/db-rows';

const ERP_ROLES = ['super_admin', 'director', 'production_manager', 'security', 'hr_manager'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('erp')
@UseGuards(RolesGuard)
@Roles(...ERP_ROLES)
export class ErpCameraController {
  private readonly logger = new Logger(ErpCameraController.name);

  constructor(private readonly svc: ErpCameraService) {}

  @Get('camera-reports/employees')
  async cameraEmployeeReports(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrThrow(await this.svc.cameraEmployeeReports(safeInt(page, 1), safeInt(limit, 50)));
  }

  @Get('camera-reports/employees/:userId')
  async cameraEmployeeReport(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const _rCameraEmployeeReport = await this.svc.cameraEmployeeReport(
      safeInt(userId, 0),
      safeInt(page, 1),
      safeInt(limit, 50),
    );
    assertOk(_rCameraEmployeeReport);
    return _rCameraEmployeeReport.data;
  }

  @Get('cameras/live-detections')
  async liveDetections(@Query('cameraId') cameraId?: string) {
    return unwrapOrThrow(await this.svc.liveDetections(cameraId ? safeInt(cameraId, 0) : undefined));
  }

  @Get('cameras/grouped-detections')
  async groupedDetections() {
    return unwrapOrThrow(await this.svc.groupedDetections());
  }

  @Get('team-analytics/departments')
  async teamAnalyticsDepartments() {
    return unwrapOrThrow(await this.svc.teamAnalyticsDepartments());
  }

  @Get('team-analytics/zone-activity')
  async teamAnalyticsZoneActivity(
    @Query('period') period?: string,
  ) {
    return unwrapOrThrow(await this.svc.teamAnalyticsZoneActivity(undefined, period));
  }

  @Get('team-analytics/zone-activity/:departmentId')
  async teamAnalyticsZoneActivityByDept(
    @Param('departmentId') deptId: string,
    @Query('period') period?: string,
  ) {
    return unwrapOrThrow(await this.svc.teamAnalyticsZoneActivity(safeInt(deptId, 0), period));
  }

  @Get('employee/:id/metrics')
  async getEmployeeMetrics(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getEmployeeMetrics(safeInt(id, 0)));
  }

  @Get('employee/:id/transfer-history')
  async getEmployeeTransferHistory(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getEmployeeTransferHistory(safeInt(id, 0)));
  }
}
