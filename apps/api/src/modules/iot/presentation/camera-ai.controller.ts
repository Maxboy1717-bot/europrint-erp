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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Camera Ai')
@ApiBearerAuth()
@Controller('camera-ai')
export class CameraAiController {
  constructor(private readonly svc: CameraAiService, private readonly i18n: I18nService) {}

  @ApiOperation({ summary: 'Get summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('summary')
  @Roles(...CAM_READ)
  async getSummary() {
    return unwrapOrThrow(await this.svc.getSummary());
  }

  @ApiOperation({ summary: 'Get safety trends' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('safety-trends')
  @Roles(...CAM_READ)
  async getSafetyTrends(@Query() raw: Record<string, unknown>) {
    const q = CameraAiSafetyTrendsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getSafetyTrends(q.days));
  }

  @ApiOperation({ summary: 'Get quality analysis' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('quality-analysis')
  @Roles(...CAM_READ)
  async getQualityAnalysis() {
    return unwrapOrThrow(await this.svc.getQualityAnalysis());
  }

  @ApiOperation({ summary: 'Get productivity scores' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('productivity-scores')
  @Roles(...CAM_READ)
  async getProductivityScores() {
    return unwrapOrThrow(await this.svc.getProductivityScores());
  }

  @ApiOperation({ summary: 'Get machine utilization' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('machine-utilization')
  @Roles(...CAM_READ)
  async getMachineUtilization() {
    return unwrapOrThrow(await this.svc.getMachineUtilization());
  }

  @ApiOperation({ summary: 'Get anomaly detection' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('anomaly-detection')
  @Roles(...CAM_READ)
  async getAnomalyDetection() {
    return unwrapOrThrow(await this.svc.getAnomalyDetection());
  }

  @ApiOperation({ summary: 'List cameras ai' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('cameras')
  @Roles(...CAM_READ)
  async listCamerasAi() {
    return unwrapOrThrow(await this.svc.listCamerasAi());
  }

  @ApiOperation({ summary: 'Get camera trigger rules' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('cameras/:id/trigger-rules')
  @Roles(...CAM_READ)
  async getCameraTriggerRules(@Param('id') id: string) {
    const result = await this.svc.getCameraTriggerRules(id);
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Update camera prompt' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Put('cameras/:id/prompt')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async updateCameraPrompt(
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const dto = UpdateCameraPromptDtoSchema.parse(body);
    const content = dto.prompt ?? dto.instructions;
    assertRequired(content, await this.i18n.t('validation.promptOrInstructionsRequired'));
    const result = await this.svc.updateCameraPrompt(
      id, content, dto.zone, dto.alertThreshold, dto.isActive, dto.triggerRules,
    );
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Update camera trigger rules' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Put('cameras/:id/trigger-rules')
  @Roles(...CAM_WRITE)
  @UseInterceptors(AuditInterceptor)
  async updateCameraTriggerRules(
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const dto = UpdateTriggerRulesDtoSchema.parse(body);
    const result = await this.svc.updateCameraTriggerRulesFromBody(
      id, dto.triggerRules, dto.zone, dto.alertThreshold, dto.isActive,
    );
    assertOk(result);
    return result.data;
  }
}
