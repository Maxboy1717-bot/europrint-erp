/**
 * @module camera-recognition.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller, Get, HttpCode, HttpStatus, InternalServerErrorException,
  Param, ParseIntPipe, Patch, Post, Query, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CameraExtendedService } from '../application/camera-extended.service';
import { RecognitionLogsQuerySchema } from './dto/iot-camera.dto';

const CAM_READ = ['super_admin', 'director', 'security_manager', 'production_manager', 'ERP_MANAGER', 'admin'];
const CAM_WRITE = ['super_admin', 'director', 'security_manager', 'ERP_MANAGER', 'admin'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('camera')
export class CameraRecognitionController {
  constructor(private readonly svc: CameraExtendedService) {}

  @Get('recognition-stats')
  @Roles(...CAM_READ)
  async getRecognitionStats() {
    return unwrapOrThrow(await this.svc.getRecognitionStats());
  }

  @Get('recognition-logs')
  @Roles(...CAM_READ)
  async getRecognitionLogs(@Query() raw: Record<string, unknown>) {
    const q = RecognitionLogsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getRecognitionLogs(q.limit, q.camera_id, q.flagged));
  }

  @Patch('recognition-logs/:id/flag')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async flagLog(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.flagRecognitionLog(id));
  }

  @Patch('recognition-logs/:id/unflag')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async unflagLog(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.unflagRecognitionLog(id));
  }

  @Post('recognition-logs/:id/flag')
  @HttpCode(HttpStatus.OK)
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async postFlagLog(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.flagRecognitionLog(id));
  }

  @Post('recognition-logs/:id/unflag')
  @HttpCode(HttpStatus.OK)
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async postUnflagLog(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.unflagRecognitionLog(id));
  }
}
