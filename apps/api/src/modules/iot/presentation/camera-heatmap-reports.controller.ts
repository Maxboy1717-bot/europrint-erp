import {
  Body, Controller, Get, InternalServerErrorException,
  Param, Post, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CameraDashboardService } from '../application/camera-dashboard.service';
import { LimitQuerySchema, ReportGenerateBodySchema } from './dto/iot-camera.dto';

const CAM_READ = ['super_admin', 'director', 'security_manager', 'production_manager', 'ERP_MANAGER', 'admin'];
const CAM_WRITE = ['super_admin', 'director', 'security_manager', 'ERP_MANAGER', 'admin'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('camera-heatmap')
export class CameraHeatmapController {
  constructor(private readonly svc: CameraDashboardService) {}

  @Get('data')
  @Roles(...CAM_READ)
  async getHeatmapData(
    @Query('zone_id') zoneId?: string,
    @Query('date') date?: string,
  ) {
    return unwrapOrThrow(await this.svc.getHeatmapData(zoneId, date));
  }

  @Get('employees')
  @Roles(...CAM_READ)
  async getHeatmapEmployees(@Query() raw: Record<string, unknown>) {
    const q = LimitQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getHeatmapEmployees(q.limit));
  }

  @Get('employee')
  @Roles(...CAM_READ)
  async getHeatmapEmployeeList(@Query() raw: Record<string, unknown>) {
    const q = LimitQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getHeatmapEmployees(q.limit));
  }

  @Get('employee/:id')
  @Roles(...CAM_READ)
  async getHeatmapEmployee(@Param('id') id: string) {
    return unwrapOrThrow(await this.svc.getHeatmapEmployee(id));
  }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('camera-reports')
export class CameraReportsController {
  constructor(private readonly svc: CameraDashboardService) {}

  @Post('generate-pdf')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async generatePdf(@Body() body: Record<string, unknown>) {
    const dto = ReportGenerateBodySchema.parse(body);
    return unwrapOrThrow(await this.svc.generateReport('pdf', dto.date_from, dto.date_to));
  }

  @Post('generate-excel')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async generateExcel(@Body() body: Record<string, unknown>) {
    const dto = ReportGenerateBodySchema.parse(body);
    return unwrapOrThrow(await this.svc.generateReport('excel', dto.date_from, dto.date_to));
  }
}
