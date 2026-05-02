import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Role } from '@common/constants/roles.constants';
import { CameraService } from './camera.service';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
import { unwrapOrInternal } from '@common/http-result';
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('camera')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER)
@UseInterceptors(AuditInterceptor)
export class CameraController {
  constructor(private readonly svc: CameraService) {}

  @Get('status')
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }

  @Get('list')
  async getCameras(@Query('active') active?: string) {
    const isActive = active === 'true' ? true : active === 'false' ? false : undefined;
    return unwrapOrInternal(await this.svc.getCameras(isActive));
  }

  @Get('events')
  async getEvents(
    @Query('cameraId') cameraId?: string,
    @Query('severity') severity?: string,
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const limit = Math.min(parseInt(limitParam ?? '50', 10) || 50, MAX_QUERY_LIMIT);
    const offset = parseInt(offsetParam ?? '0', 10) || 0;
    return unwrapOrInternal(await this.svc.getEvents(cameraId, severity, limit, offset));
  }

  @Get('zones')
  async getZones() {
    return unwrapOrInternal(await this.svc.getZones());
  }
}
