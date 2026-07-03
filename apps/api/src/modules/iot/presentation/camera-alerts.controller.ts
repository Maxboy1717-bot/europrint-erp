/**
 * @module camera-alerts.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
  Body, Controller, Delete, Get, InternalServerErrorException,
  Param, ParseIntPipe, Patch, Post, Put, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

const AnalyzeMissionsSchema = z.object({
  missions: z.array(z.union([z.string(), z.record(z.unknown())])).optional(),
}).passthrough();
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CameraExtendedService } from '../application/camera-extended.service';
import { IotMainService } from '../application/iot-main.service';
import {
  CameraAlertsQuerySchema,
  CameraGlobalSettingsBodySchema,
  CreateCameraManagementBodySchema,
  EmployeeRatingsQuerySchema,
  LimitQuerySchema,
  MachineLogsQuerySchema,
  QualityDefectsCameraQuerySchema,
  ResolveAlertBodySchema,
  UpdateCameraManagementBodySchema,
} from './dto/iot-camera.dto';

const CAM_READ = ['super_admin', 'director', 'security_manager', 'production_manager', 'ERP_MANAGER', 'admin'];
const CAM_WRITE = ['super_admin', 'director', 'security_manager', 'ERP_MANAGER', 'admin'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Camera Alerts')
@ApiBearerAuth()
@Controller('camera-alerts')
export class CameraAlertsRouteController {
  constructor(private readonly svc: CameraExtendedService) {}

  @ApiOperation({ summary: 'Get alerts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(...CAM_READ)
  async getAlerts(@Query() raw: Record<string, unknown>) {
    const q = CameraAlertsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getCameraAlerts(q.status, q.severity, q.limit));
  }

  @ApiOperation({ summary: 'Acknowledge' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/acknowledge')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async acknowledge(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.acknowledgeCameraAlert(id));
  }

  @ApiOperation({ summary: 'Resolve' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post(':id/resolve')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async resolve(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = ResolveAlertBodySchema.parse(body);
    return unwrapOrThrow(await this.svc.resolveCameraAlert(id, dto.notes));
  }

  @ApiOperation({ summary: 'Patch acknowledge' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/acknowledge')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async patchAcknowledge(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.acknowledgeCameraAlert(id));
  }

  @ApiOperation({ summary: 'Patch resolve' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch(':id/resolve')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async patchResolve(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = ResolveAlertBodySchema.parse(body);
    return unwrapOrThrow(await this.svc.resolveCameraAlert(id, dto.notes));
  }
}

/**
 * Global AI/alert/telegram/penalty settings singleton consumed by the
 * "Kamera Sozlamalari" page (camera-settings.tsx → CameraSettingsData).
 * Was previously wired to `getCameraSettings()`/`updateCameraSettings()` (a
 * per-camera list with zone info + a fake echo) — a shape mismatch the FE
 * page never actually read correctly (Q-40/Q-46 fix: page always saw
 * `undefined` thresholds and saves never persisted). Now backed by a real
 * singleton row in the generic `settings` key-value table (Q-35 — no new table).
 */
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('camera-settings')
export class CameraSettingsController {
  constructor(private readonly svc: CameraExtendedService) {}

  @ApiOperation({ summary: 'Get global camera AI/alert settings' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(...CAM_READ)
  async getSettings() {
    return unwrapOrThrow(await this.svc.getGlobalCameraSettings());
  }

  @ApiOperation({ summary: 'Save global camera AI/alert settings' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async createSettings(@Body() body: unknown) {
    const dto = CameraGlobalSettingsBodySchema.parse(body);
    return unwrapOrThrow(await this.svc.saveGlobalCameraSettings(dto));
  }

  @ApiOperation({ summary: 'Update global camera AI/alert settings' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Put()
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async updateSettings(@Body() body: unknown) {
    const dto = CameraGlobalSettingsBodySchema.parse(body);
    return unwrapOrThrow(await this.svc.saveGlobalCameraSettings(dto));
  }
}

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cameras')
export class CamerasListController {
  constructor(private readonly svc: CameraExtendedService) {}

  @ApiOperation({ summary: 'List' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(...CAM_READ)
  async list(
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return unwrapOrThrow(await this.svc.listAllCameras(status, type));
  }

  /** Cameras Management page (cameras-management.tsx) — add camera form. */
  @ApiOperation({ summary: 'Create camera' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async create(@Body() body: unknown) {
    const dto = CreateCameraManagementBodySchema.parse(body);
    return unwrapOrThrow(await this.svc.createCameraManagement(dto));
  }

  @ApiOperation({ summary: 'Get one' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles(...CAM_READ)
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.getCameraById(id));
  }

  /**
   * PATCH /api/cameras/:id — shared by two FE consumers with disjoint body
   * shapes:
   *   1) Cameras Management page (cameras-management.tsx edit dialog + status
   *      toggle) sends { code?, name?, nameRu?, rtspUrl?, ipAddress?, port?,
   *      workCenterId?, location?, isActive? } — persisted for real via
   *      `updateCameraManagement` (Q-40/Q-46 fix: this branch used to only
   *      call the fake `patchCameraAi` echo, so edits never reached the DB).
   *   2) Modern camera-AI hub (camera-ai-modern/api.ts → patchCameraAi) sends
   *      { aiCategories?, aiPrompt?, aiSensitivity?, aiEnabled?, isActive? } —
   *      still routed to `patchCameraAi` (unchanged; AI-config persistence is
   *      tracked separately, out of this route's scope).
   * Discriminator: an AI-only key (aiCategories/aiPrompt/aiSensitivity/
   * aiEnabled) routes to the AI-config stub; everything else — including a
   * lone `{ isActive }` toggle, which both consumers can send — is treated
   * as a real management patch so the field always reaches the DB.
   */
  @ApiOperation({ summary: 'Update camera' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch(':id')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async patchAi(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const raw = z.record(z.unknown()).parse(body ?? {});
    const AI_ONLY_KEYS = ['aiCategories', 'aiPrompt', 'aiSensitivity', 'aiEnabled'];
    const isAiOnlyPatch = AI_ONLY_KEYS.some((k) => k in raw);
    if (isAiOnlyPatch) {
      return unwrapOrThrow(await this.svc.patchCameraAi(id, raw));
    }
    const dto = UpdateCameraManagementBodySchema.parse(raw);
    return unwrapOrThrow(await this.svc.updateCameraManagement(id, dto));
  }

  /** Cameras Management page (cameras-management.tsx) — delete camera row (soft delete). */
  @ApiOperation({ summary: 'Delete camera' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.deleteCameraManagement(id));
  }
}

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('camera-employee-ratings')
export class CameraEmployeeRatingsController {
  constructor(private readonly svc: CameraExtendedService) {}

  @ApiOperation({ summary: 'Get ratings' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(...CAM_READ)
  async getRatings(@Query() raw: Record<string, unknown>) {
    const q = EmployeeRatingsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getCameraEmployeeRatings(q.limit, q.employee_id));
  }
}

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai-camera')
export class AiCameraController {
  constructor(private readonly svc: IotMainService) {}

  @ApiOperation({ summary: 'Analyze by missions' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('analyze-by-missions')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async analyzeByMissions(@Body() body: unknown) {
    const dto = AnalyzeMissionsSchema.parse(body);
    const result = await this.svc.getDashboard();
    assertOk(result);
    return { analyzed_at: _time.now().toISOString(), missions: dto.missions ?? [], dashboard: result.data };
  }
}

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('machine-status-current')
export class MachineStatusCurrentController {
  constructor(private readonly svc: IotMainService) {}

  @ApiOperation({ summary: 'Get current' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(...CAM_READ)
  async getCurrent() {
    return unwrapOrThrow(await this.svc.getMachineStatusCurrent());
  }
}

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('machine-status-logs')
export class MachineStatusLogsController {
  constructor(private readonly svc: IotMainService) {}

  @ApiOperation({ summary: 'Get logs' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(...CAM_READ)
  async getLogs(@Query() raw: Record<string, unknown>) {
    const q = MachineLogsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getMachineStatusLogs(q.device_id, q.limit));
  }
}

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('safety-violations')
export class SafetyViolationsController {
  constructor(private readonly svc: IotMainService) {}

  @ApiOperation({ summary: 'Get violations' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(...CAM_READ)
  async getViolations(@Query() raw: Record<string, unknown>) {
    const q = CameraAlertsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getSafetyViolations(q.status, q.severity, q.limit));
  }
}

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employee-productivity')
export class EmployeeProductivityController {
  constructor(private readonly svc: IotMainService) {}

  @ApiOperation({ summary: 'Get productivity' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(...CAM_READ)
  async getProductivity(@Query() raw: Record<string, unknown>) {
    const q = LimitQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getEmployeeProductivity(undefined, q.limit));
  }
}

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quality-defects-camera')
export class QualityDefectsCameraController {
  constructor(private readonly svc: CameraExtendedService) {}

  @ApiOperation({ summary: 'Get quality defects' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(...CAM_READ)
  async getQualityDefects(@Query() raw: Record<string, unknown>) {
    const q = QualityDefectsCameraQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getQualityDefectsCamera(q.status, q.camera_id, q.defect_type, q.limit));
  }
}

