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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ErpCameraService } from './erp-camera.service';
import { safeInt } from '../hr/common/db-rows';

const ERP_ROLES = ['super_admin', 'director', 'production_manager', 'security', 'hr_manager'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Erp Camera')
@Controller('erp')
@UseGuards(RolesGuard)
@Roles(...ERP_ROLES)
export class ErpCameraController {
  private readonly logger = new Logger(ErpCameraController.name);

  constructor(private readonly svc: ErpCameraService) {}

  @ApiOperation({ summary: 'Camera employee reports' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('camera-reports/employees')
  async cameraEmployeeReports(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrThrow(await this.svc.cameraEmployeeReports(safeInt(page, 1), safeInt(limit, 50)));
  }

  @ApiOperation({ summary: 'Camera employee report' })
  @ApiResponse({ status: 200, description: 'OK' })
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

  @ApiOperation({ summary: 'Live detections' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('cameras/live-detections')
  async liveDetections(@Query('cameraId') cameraId?: string) {
    return unwrapOrThrow(await this.svc.liveDetections(cameraId ? safeInt(cameraId, 0) : undefined));
  }

  @ApiOperation({ summary: 'Grouped detections' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('cameras/grouped-detections')
  async groupedDetections() {
    return unwrapOrThrow(await this.svc.groupedDetections());
  }

  @ApiOperation({ summary: 'Team analytics departments' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('team-analytics/departments')
  async teamAnalyticsDepartments() {
    return unwrapOrThrow(await this.svc.teamAnalyticsDepartments());
  }

  @ApiOperation({ summary: 'Team analytics zone activity' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('team-analytics/zone-activity')
  async teamAnalyticsZoneActivity(
    @Query('period') period?: string,
  ) {
    return unwrapOrThrow(await this.svc.teamAnalyticsZoneActivity(undefined, period));
  }

  @ApiOperation({ summary: 'Team analytics zone activity by dept' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('team-analytics/zone-activity/:departmentId')
  async teamAnalyticsZoneActivityByDept(
    @Param('departmentId') deptId: string,
    @Query('period') period?: string,
  ) {
    return unwrapOrThrow(await this.svc.teamAnalyticsZoneActivity(safeInt(deptId, 0), period));
  }

  @ApiOperation({ summary: 'Get employee metrics' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('employee/:id/metrics')
  async getEmployeeMetrics(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getEmployeeMetrics(safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Get employee transfer history' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('employee/:id/transfer-history')
  async getEmployeeTransferHistory(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getEmployeeTransferHistory(safeInt(id, 0)));
  }
}
