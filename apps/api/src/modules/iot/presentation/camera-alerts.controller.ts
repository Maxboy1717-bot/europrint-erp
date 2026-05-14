/**
 * @module camera-alerts.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
  Body, Controller, Get, InternalServerErrorException,
  Param, ParseIntPipe, Patch, Post, Put, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CameraExtendedService } from '../application/camera-extended.service';
import { IotMainService } from '../application/iot-main.service';
import {
  CameraAlertsQuerySchema,
  EmployeeRatingsQuerySchema,
  LimitQuerySchema,
  MachineLogsQuerySchema,
  QualityDefectsCameraQuerySchema,
  ResolveAlertBodySchema,
  UpdateCameraSettingsBodySchema,
} from './dto/iot-camera.dto';

const CAM_READ = ['super_admin', 'director', 'security_manager', 'production_manager', 'ERP_MANAGER', 'admin'];
const CAM_WRITE = ['super_admin', 'director', 'security_manager', 'ERP_MANAGER', 'admin'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('camera-alerts')
export class CameraAlertsRouteController {
  constructor(private readonly svc: CameraExtendedService) {}

  @Get()
  @Roles(...CAM_READ)
  async getAlerts(@Query() raw: Record<string, unknown>) {
    const q = CameraAlertsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getCameraAlerts(q.status, q.severity, q.limit));
  }

  @Post(':id/acknowledge')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async acknowledge(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.acknowledgeCameraAlert(id));
  }

  @Post(':id/resolve')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async resolve(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
  ) {
    const dto = ResolveAlertBodySchema.parse(body);
    return unwrapOrThrow(await this.svc.resolveCameraAlert(id, dto.notes));
  }

  @Patch(':id/acknowledge')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async patchAcknowledge(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.acknowledgeCameraAlert(id));
  }

  @Patch(':id/resolve')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async patchResolve(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
  ) {
    const dto = ResolveAlertBodySchema.parse(body);
    return unwrapOrThrow(await this.svc.resolveCameraAlert(id, dto.notes));
  }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('camera-settings')
export class CameraSettingsController {
  constructor(private readonly svc: CameraExtendedService) {}

  @Get()
  @Roles(...CAM_READ)
  async getSettings() {
    return unwrapOrThrow(await this.svc.getCameraSettings());
  }

  @Put()
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async updateSettings(@Body() body: Record<string, unknown>) {
    const dto = UpdateCameraSettingsBodySchema.parse(body);
    return unwrapOrThrow(await this.svc.updateCameraSettings(dto));
  }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cameras')
export class CamerasListController {
  constructor(private readonly svc: CameraExtendedService) {}

  @Get()
  @Roles(...CAM_READ)
  async list(
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return unwrapOrThrow(await this.svc.listAllCameras(status, type));
  }

  @Get(':id')
  @Roles(...CAM_READ)
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.getCameraById(id));
  }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('camera-employee-ratings')
export class CameraEmployeeRatingsController {
  constructor(private readonly svc: CameraExtendedService) {}

  @Get()
  @Roles(...CAM_READ)
  async getRatings(@Query() raw: Record<string, unknown>) {
    const q = EmployeeRatingsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getCameraEmployeeRatings(q.limit, q.employee_id));
  }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai-camera')
export class AiCameraController {
  constructor(private readonly svc: IotMainService) {}

  @Post('analyze-by-missions')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async analyzeByMissions(@Body() body: Record<string, unknown>) {
    const result = await this.svc.getDashboard();
    assertOk(result);
    return { analyzed_at: _time.now().toISOString(), missions: body['missions'] ?? [], dashboard: result.data };
  }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('machine-status-current')
export class MachineStatusCurrentController {
  constructor(private readonly svc: IotMainService) {}

  @Get()
  @Roles(...CAM_READ)
  async getCurrent() {
    return unwrapOrThrow(await this.svc.getMachineStatusCurrent());
  }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('machine-status-logs')
export class MachineStatusLogsController {
  constructor(private readonly svc: IotMainService) {}

  @Get()
  @Roles(...CAM_READ)
  async getLogs(@Query() raw: Record<string, unknown>) {
    const q = MachineLogsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getMachineStatusLogs(q.device_id, q.limit));
  }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('safety-violations')
export class SafetyViolationsController {
  constructor(private readonly svc: IotMainService) {}

  @Get()
  @Roles(...CAM_READ)
  async getViolations(@Query() raw: Record<string, unknown>) {
    const q = CameraAlertsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getSafetyViolations(q.status, q.severity, q.limit));
  }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employee-productivity')
export class EmployeeProductivityController {
  constructor(private readonly svc: IotMainService) {}

  @Get()
  @Roles(...CAM_READ)
  async getProductivity(@Query() raw: Record<string, unknown>) {
    const q = LimitQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getEmployeeProductivity(undefined, q.limit));
  }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quality-defects-camera')
export class QualityDefectsCameraController {
  constructor(private readonly svc: CameraExtendedService) {}

  @Get()
  @Roles(...CAM_READ)
  async getQualityDefects(@Query() raw: Record<string, unknown>) {
    const q = QualityDefectsCameraQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getQualityDefectsCamera(q.status, q.camera_id, q.defect_type, q.limit));
  }
}

