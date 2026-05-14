/**
 * @module camera-ai.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { assertRequired } from '@common/assertions';
import {
  Controller, Get, InternalServerErrorException,
  NotFoundException, Param, Put, Body, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CameraAiService } from '../application/camera-ai.service';
import {
  CameraAiSafetyTrendsQuerySchema,
  UpdateCameraPromptDtoSchema,
  UpdateTriggerRulesDtoSchema,
} from './dto/iot-camera.dto';

const CAM_READ = ['super_admin', 'director', 'security_manager', 'production_manager', 'ERP_MANAGER', 'admin'];
const CAM_WRITE = ['super_admin', 'director', 'security_manager', 'ERP_MANAGER', 'admin'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('camera-ai')
export class CameraAiController {
  constructor(private readonly svc: CameraAiService) {}

  @Get('summary')
  @Roles(...CAM_READ)
  async getSummary() {
    return unwrapOrThrow(await this.svc.getSummary());
  }

  @Get('safety-trends')
  @Roles(...CAM_READ)
  async getSafetyTrends(@Query() raw: Record<string, unknown>) {
    const q = CameraAiSafetyTrendsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getSafetyTrends(q.days));
  }

  @Get('quality-analysis')
  @Roles(...CAM_READ)
  async getQualityAnalysis() {
    return unwrapOrThrow(await this.svc.getQualityAnalysis());
  }

  @Get('productivity-scores')
  @Roles(...CAM_READ)
  async getProductivityScores() {
    return unwrapOrThrow(await this.svc.getProductivityScores());
  }

  @Get('machine-utilization')
  @Roles(...CAM_READ)
  async getMachineUtilization() {
    return unwrapOrThrow(await this.svc.getMachineUtilization());
  }

  @Get('anomaly-detection')
  @Roles(...CAM_READ)
  async getAnomalyDetection() {
    return unwrapOrThrow(await this.svc.getAnomalyDetection());
  }

  @Get('cameras')
  @Roles(...CAM_READ)
  async listCamerasAi() {
    return unwrapOrThrow(await this.svc.listCamerasAi());
  }

  @Get('cameras/:id/trigger-rules')
  @Roles(...CAM_READ)
  async getCameraTriggerRules(@Param('id') id: string) {
    const result = await this.svc.getCameraTriggerRules(id);
    assertOk(result);
    return result.data;
  }

  @Put('cameras/:id/prompt')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async updateCameraPrompt(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const dto = UpdateCameraPromptDtoSchema.parse(body);
    const content = dto.prompt ?? dto.instructions;
    assertRequired(content, 'prompt yoki instructions talab qilinadi');
    const result = await this.svc.updateCameraPrompt(
      id, content, dto.zone, dto.alertThreshold, dto.isActive, dto.triggerRules,
    );
    assertOk(result);
    return result.data;
  }

  @Put('cameras/:id/trigger-rules')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async updateCameraTriggerRules(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const dto = UpdateTriggerRulesDtoSchema.parse(body);
    const result = await this.svc.updateCameraTriggerRulesFromBody(
      id, dto.triggerRules, dto.zone, dto.alertThreshold, dto.isActive,
    );
    assertOk(result);
    return result.data;
  }
}
