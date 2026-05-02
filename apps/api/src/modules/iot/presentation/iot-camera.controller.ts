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
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { IotCameraService } from '../application/iot-camera.service';
import {
  CreateCameraBodySchema,
  CreateCameraZoneBodySchema,
  UpdateCameraBodySchema,
} from './dto/iot-camera.dto';

const MANAGER_ROLES = ['production_manager', 'manager', 'super_admin', 'director', 'security_manager', 'admin'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('camera')
export class IotCameraController {
  constructor(private readonly svc: IotCameraService) {}

  @Get('cameras')
  async listCameras(@Query('status') status?: string, @Query('zone') zone?: string) {
    return unwrapOrThrow(await this.svc.listCameras(status, zone));
  }

  @Get('cameras/:id')
  async getCamera(@Param('id', ParseIntPipe) id: number) {
    const data = await this.svc.getCamera(id);
    assertFound(data, 'Kamera topilmadi');
    return Array.isArray(data) ? data[0] : data;
  }

  @Post('cameras')
  @UseGuards(RolesGuard)
  @Roles(...MANAGER_ROLES)
  async createCamera(@Body() body: Record<string, unknown>) {
    const dto = parseOrThrow(CreateCameraBodySchema, body);
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

  @Patch('cameras/:id')
  @UseGuards(RolesGuard)
  @Roles(...MANAGER_ROLES)
  async updateCamera(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
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

  @Delete('cameras/:id')
  @UseGuards(RolesGuard)
  @Roles(...MANAGER_ROLES)
  async deleteCamera(@Param('id', ParseIntPipe) id: number) {
    await this.svc.deleteCamera(id);
    return { message: "O'chirildi" };
  }

  @Get('cameras/:cameraId/zones')
  async getCameraZones(@Param('cameraId', ParseIntPipe) cameraId: number) {
    return unwrapOrThrow(await this.svc.getCameraZones(cameraId));
  }

  @Post('camera-zones')
  @UseGuards(RolesGuard)
  @Roles(...MANAGER_ROLES)
  async createCameraZone(@Body() body: Record<string, unknown>) {
    const dto = CreateCameraZoneBodySchema.parse(body);
    return unwrapOrThrow(await this.svc.createCameraZone(dto.name, dto.camera_id, dto.coordinates, dto.zone_type));
  }
}
