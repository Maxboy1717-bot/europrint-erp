/**
 * @module iot-camera-events.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertRequired } from '@common/assertions';
import {
  AuditInterceptor } from '@common/interceptors/audit.interceptor';import { BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { IotCameraEventsService } from '../application/iot-camera-events.service';
import {
  CameraEventsQuerySchema,
  CreateCameraEventBodySchema,
  CreateQualityDefectBodySchema,
  CreateSafetyViolationBodySchema,
  UpdateEventStatusBodySchema,
  ViolationsQuerySchema,
} from './dto/iot-camera.dto';

const MANAGER_ROLES = ['production_manager', 'manager', 'super_admin', 'director', 'security_manager', 'admin'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Iot Camera Events')
@Controller('camera')
export class IotCameraEventsController {
  constructor(private readonly svc: IotCameraEventsService, private readonly i18n: I18nService) {}

  @ApiOperation({ summary: 'List camera events' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('camera-events')
  async listCameraEvents(@Query() raw: Record<string, unknown>) {
    const q = CameraEventsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.listCameraEvents(q.camera_id, q.type, q.limit));
  }

  @ApiOperation({ summary: 'Create camera event' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('camera-events')
  @UseGuards(RolesGuard)
  @Roles(...MANAGER_ROLES)
  async createCameraEvent(@Body() body: unknown) {
    const dto = CreateCameraEventBodySchema.parse(body);
    const cameraEventMsg = await this.i18n.t('validation.cameraIdAndEventTypeRequired');
    assertRequired(dto.camera_id, cameraEventMsg);
    assertRequired(dto.event_type, cameraEventMsg);
    const _rCreateCameraEvent = await this.svc.createCameraEvent(
      dto.camera_id,
      dto.event_type,
      dto.description ?? null,
      dto.severity,
      dto.zone_id ?? null,
    );
    assertOk(_rCreateCameraEvent);
    return _rCreateCameraEvent.data;
  }

  @ApiOperation({ summary: 'Update camera event' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('camera-events/:id')
  @UseGuards(RolesGuard)
  @Roles(...MANAGER_ROLES)
  async updateCameraEvent(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateEventStatusBodySchema.parse(body);
    return unwrapOrThrow(await this.svc.updateCameraEvent(parseInt(id, 10), dto.status ?? null, dto.resolution_note ?? null));
  }

  @ApiOperation({ summary: 'List safety violations' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('safety-violations')
  async listSafetyViolations(@Query() raw: Record<string, unknown>) {
    const q = ViolationsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.listSafetyViolations(q.camera_id, q.status, q.limit));
  }

  @ApiOperation({ summary: 'Create safety violation' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('safety-violations')
  @UseGuards(RolesGuard)
  @Roles(...MANAGER_ROLES)
  async createSafetyViolation(@Body() body: unknown) {
    const dto = CreateSafetyViolationBodySchema.parse(body);
    const _rCreateSafetyViolation = await this.svc.createSafetyViolation(
      dto.camera_id,
      dto.violation_type,
      dto.severity,
      dto.description ?? null,
      dto.employee_id ?? null,
    );
    assertOk(_rCreateSafetyViolation);
    return _rCreateSafetyViolation.data;
  }

  @ApiOperation({ summary: 'List quality defects' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('quality-defects-camera')
  async listQualityDefects(@Query('camera_id') cameraId?: string, @Query('status') status?: string) {
    return unwrapOrThrow(await this.svc.listQualityDefects(cameraId, status));
  }

  @ApiOperation({ summary: 'Create quality defect' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('quality-defects-camera')
  @UseGuards(RolesGuard)
  @Roles(...MANAGER_ROLES)
  async createQualityDefect(@Body() body: unknown) {
    const dto = CreateQualityDefectBodySchema.parse(body);
    const _rCreateQualityDefect = await this.svc.createQualityDefect(
      dto.camera_id,
      dto.defect_type,
      dto.severity,
      dto.description ?? null,
    );
    assertOk(_rCreateQualityDefect);
    return _rCreateQualityDefect.data;
  }

  @ApiOperation({ summary: 'Update quality defect' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('quality-defects-camera/:id')
  @UseGuards(RolesGuard)
  @Roles(...MANAGER_ROLES)
  async updateQualityDefect(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateEventStatusBodySchema.parse(body);
    return unwrapOrThrow(await this.svc.updateQualityDefect(parseInt(id, 10), dto.status ?? null, dto.resolution_note ?? null));
  }
}
