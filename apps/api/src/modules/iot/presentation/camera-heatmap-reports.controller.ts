/**
 * @module camera-heatmap-reports.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Get, InternalServerErrorException,
  Param, Post, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CameraDashboardService } from '../application/camera-dashboard.service';
import { LimitQuerySchema, ReportGenerateBodySchema } from './dto/iot-camera.dto';

const CAM_READ = ['super_admin', 'director', 'security_manager', 'production_manager'];
const CAM_WRITE = ['super_admin', 'director', 'security_manager'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Camera Heatmap Reports')
@ApiBearerAuth()
@Controller('camera-heatmap')
export class CameraHeatmapController {
  constructor(private readonly svc: CameraDashboardService) {}

  @ApiOperation({ summary: 'Get heatmap data' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('data')
  @Roles(...CAM_READ)
  async getHeatmapData(
    @Query('zone_id') zoneId?: string,
    @Query('date') date?: string,
  ) {
    return unwrapOrThrow(await this.svc.getHeatmapData(zoneId, date));
  }

  @ApiOperation({ summary: 'Get heatmap employees' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('employees')
  @Roles(...CAM_READ)
  async getHeatmapEmployees(@Query() raw: Record<string, unknown>) {
    const q = LimitQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getHeatmapEmployees(q.limit));
  }

  @ApiOperation({ summary: 'Get heatmap employee list' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('employee')
  @Roles(...CAM_READ)
  async getHeatmapEmployeeList(@Query() raw: Record<string, unknown>) {
    const q = LimitQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getHeatmapEmployees(q.limit));
  }

  @ApiOperation({ summary: 'Get heatmap employee' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('employee/:id')
  @Roles(...CAM_READ)
  async getHeatmapEmployee(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getHeatmapEmployee(id));
  }
}

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('camera-reports')
export class CameraReportsController {
  constructor(private readonly svc: CameraDashboardService) {}

  @ApiOperation({ summary: 'Generate pdf' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('generate-pdf')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async generatePdf(@Body() body: unknown) {
    const dto = ReportGenerateBodySchema.parse(body);
    return unwrapOrThrow(await this.svc.generateReport('pdf', dto.date_from, dto.date_to));
  }

  @ApiOperation({ summary: 'Generate excel' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('generate-excel')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async generateExcel(@Body() body: unknown) {
    const dto = ReportGenerateBodySchema.parse(body);
    return unwrapOrThrow(await this.svc.generateReport('excel', dto.date_from, dto.date_to));
  }
}
