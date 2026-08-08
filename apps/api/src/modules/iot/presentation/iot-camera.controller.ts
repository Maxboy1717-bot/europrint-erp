/**
 * @module iot-camera.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound } from '@common/assertions';
import { parseOrThrow } from '@common/utils/parse-or-throw.util';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { I18nService } from 'nestjs-i18n';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { IotCameraService } from '../application/iot-camera.service';
import {
  CreateCameraBodySchema,
  CreateCameraZoneBodySchema,
  UpdateCameraBodySchema,
} from './dto/iot-camera.dto';

const MANAGER_ROLES = ['production_manager', 'manager', 'super_admin', 'director', 'security_manager', 'admin'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Iot Camera')
@Controller('camera')
export class IotCameraController {
  constructor(
    private readonly svc: IotCameraService,
    private readonly i18n: I18nService,
  ) {}

  @ApiOperation({ summary: 'List cameras' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('cameras')
  async listCameras(@Query('status') status?: string, @Query('zone') zone?: string) {
    return unwrapOrThrow(await this.svc.listCameras(status, zone));
  }

  @ApiOperation({ summary: 'Get camera' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('cameras/:id')
  async getCamera(@Param('id', ParseIntPipe) id: number) {
    const data = await this.svc.getCamera(id);
    assertFound(data, await this.i18n.t('errors.cameraNotFound'));
    return Array.isArray(data) ? data[0] : data;
  }

  @ApiOperation({ summary: 'Create camera' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('cameras')
  @UseGuards(RolesGuard)
  @Roles(...MANAGER_ROLES)
  async createCamera(@Body() body: unknown) {
    const dto = parseOrThrow(CreateCameraBodySchema, body, await this.i18n.t('validation.validationFailed'));
    const _rCreateCamera = await this.svc.createCamera(
      dto.name,
      dto.location ?? null,
      dto.ip_address ?? null,
      dto.rtsp_url ?? null,
      dto.zone_id ?? null,
      dto.type,
    );
    assertOk(_rCreateCamera);
    return _rCreateCamera.data;
  }

  @ApiOperation({ summary: 'Update camera' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('cameras/:id')
  @UseGuards(RolesGuard)
  @Roles(...MANAGER_ROLES)
  async updateCamera(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = UpdateCameraBodySchema.parse(body);
    const _rUpdateCamera = await this.svc.updateCamera(
      id,
      dto.name ?? null,
      dto.location ?? null,
      dto.ip_address ?? null,
      dto.rtsp_url ?? null,
      dto.status ?? null,
      dto.zone_id ?? null,
    );
    assertOk(_rUpdateCamera);
    return _rUpdateCamera.data;
  }

  @ApiOperation({ summary: 'Delete camera' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('cameras/:id')
  @UseGuards(RolesGuard)
  @Roles(...MANAGER_ROLES)
  async deleteCamera(@Param('id', ParseIntPipe) id: number) {
    await this.svc.deleteCamera(id);
    return { message: await this.i18n.t('messages.deleted'), code: 'DELETED' };
  }

  @ApiOperation({ summary: 'Get camera zones' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('cameras/:cameraId/zones')
  async getCameraZones(@Param('cameraId', ParseIntPipe) cameraId: number) {
    return unwrapOrThrow(await this.svc.getCameraZones(cameraId));
  }

  @ApiOperation({ summary: 'Create camera zone' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('camera-zones')
  @UseGuards(RolesGuard)
  @Roles(...MANAGER_ROLES)
  async createCameraZone(@Body() body: unknown) {
    const dto = CreateCameraZoneBodySchema.parse(body);
    return unwrapOrThrow(await this.svc.createCameraZone(dto.name, dto.camera_id, dto.coordinates, dto.zone_type));
  }
}
