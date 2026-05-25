/**
 * @module camera-recognition.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller, Get, HttpCode, HttpStatus, InternalServerErrorException,
  Param, ParseIntPipe, Patch, Post, Query, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CameraExtendedService } from '../application/camera-extended.service';
import { RecognitionLogsQuerySchema } from './dto/iot-camera.dto';

const CAM_READ = ['super_admin', 'director', 'security_manager', 'production_manager', 'ERP_MANAGER', 'admin'];
const CAM_WRITE = ['super_admin', 'director', 'security_manager', 'ERP_MANAGER', 'admin'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Camera Recognition')
@ApiBearerAuth()
@Controller('camera')
export class CameraRecognitionController {
  constructor(private readonly svc: CameraExtendedService) {}

  @ApiOperation({ summary: 'Get recognition stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('recognition-stats')
  @Roles(...CAM_READ)
  async getRecognitionStats() {
    return unwrapOrThrow(await this.svc.getRecognitionStats());
  }

  @ApiOperation({ summary: 'Get recognition logs' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('recognition-logs')
  @Roles(...CAM_READ)
  async getRecognitionLogs(@Query() raw: Record<string, unknown>) {
    const q = RecognitionLogsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getRecognitionLogs(q.limit, q.camera_id, q.flagged));
  }

  @ApiOperation({ summary: 'Flag log' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('recognition-logs/:id/flag')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async flagLog(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.flagRecognitionLog(id));
  }

  @ApiOperation({ summary: 'Unflag log' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('recognition-logs/:id/unflag')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async unflagLog(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.unflagRecognitionLog(id));
  }

  @ApiOperation({ summary: 'Post flag log' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('recognition-logs/:id/flag')
  @HttpCode(HttpStatus.OK)
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async postFlagLog(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.flagRecognitionLog(id));
  }

  @ApiOperation({ summary: 'Post unflag log' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('recognition-logs/:id/unflag')
  @HttpCode(HttpStatus.OK)
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async postUnflagLog(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.svc.unflagRecognitionLog(id));
  }
}
