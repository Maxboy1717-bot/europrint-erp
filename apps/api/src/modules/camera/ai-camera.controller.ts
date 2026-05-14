/**
 * @module ai-camera.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Role } from '@common/constants/roles.constants';
import { CameraService } from './camera.service';

import { parsePagination } from '@common/pipes/parse-pagination.pipe';
import { unwrapOrInternal } from '@common/http-result';
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('ai-camera')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER)
@UseInterceptors(AuditInterceptor)
export class AiCameraController {
  constructor(private readonly svc: CameraService) {}

  @Get('dashboard')
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }

  @Get('events')
  async getEvents(
    @Query('cameraId') cameraId?: string,
    @Query('severity') severity?: string,
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const { limit, offset } = parsePagination(limitParam, offsetParam);
    return unwrapOrInternal(await this.svc.getEvents(cameraId, severity, limit, offset));
  }

  @Get('alerts')
  async getAlerts(
    @Query('status') status?: string,
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const { limit, offset } = parsePagination(limitParam, offsetParam);
    return unwrapOrInternal(await this.svc.getAlerts(status, limit, offset));
  }

  @Get('analyze-by-missions')
  async analyzeByMissions() { return { data: [], total: 0 }; }
}
