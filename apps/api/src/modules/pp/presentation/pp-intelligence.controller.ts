/**
 * @module pp-intelligence.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller, Get, Post, Body, Param,
  Query, HttpCode, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow } from '@common/http-result';
import { z } from 'zod';
import { PpIntelligenceService } from '../application/services/pp-intelligence.service';
import { PpMpsService } from '../application/services/pp-mps.service';
import { PpCrpService } from '../application/services/pp-crp.service';
import { PpAiPlanningService } from '../application/services/pp-ai-planning.service';

const MrpRunSchema = z.object({
  lotSizingMethod: z.enum(['L4L', 'EOQ', 'POQ', 'WAGNER_WHITIN']).optional(),
  horizonPeriods: z.number().int().positive().max(52).optional(),
  mpsRows: z.array(z.object({
    productId: z.string(),
    periodIndex: z.number().int().nonnegative(),
    quantity: z.number().nonnegative(),
  })).optional(),
});

@ApiThrottle()
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
@ApiTags('Pp Intelligence')
@ApiBearerAuth()
@Controller('pp')
export class PpIntelligenceController {
  constructor(
    private readonly svc: PpIntelligenceService,
    private readonly mpsSvc: PpMpsService,
    private readonly crpSvc: PpCrpService,
    private readonly aiPlanSvc: PpAiPlanningService,
  ) {}

  @ApiOperation({ summary: 'AI-planning 7-step skeleton (key-gated step 7)' })
  @ApiResponse({ status: 200, description: 'OK — partial when no AI key configured' })
  @Get('ai-plan/skeleton')
  @RequirePermission('pp:READ')
  async getAiPlanSkeleton(@Query('planDate') planDate?: string) {
    return unwrapOrThrow(await this.aiPlanSvc.buildSkeleton(planDate));
  }

  @ApiOperation({ summary: 'Run mrp' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('mrp/run')
  @HttpCode(200)
  @RequirePermission('pp:WRITE')
  async runMrp(@Body() body: unknown) {
    const input = MrpRunSchema.parse(body);
    const result = unwrapOrThrow(await this.svc.runMrp(input));
    // Qoida 6 (audit 2026-08-06 T22B): matrix assembly lives in the service now.
    return this.svc.formatMrpResponse(result, input.lotSizingMethod ?? 'L4L', input.horizonPeriods ?? 12);
  }

  @ApiOperation({ summary: 'Get mps' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('mps')
  @RequirePermission('pp:READ')
  async getMps(@Query('productId') productId?: string) {
    return unwrapOrThrow(await this.mpsSvc.getMps(productId));
  }

  @ApiOperation({ summary: 'Get crp' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('crp')
  @RequirePermission('pp:READ')
  async getCrp() {
    const workCenters = unwrapOrThrow(await this.crpSvc.getCrp());
    const bottleneckCount = (Array.isArray(workCenters) ? workCenters : []).filter((w) => w.isBottleneck).length;
    const avgUtilization = workCenters.length > 0
      ? (Array.isArray(workCenters) ? workCenters : []).reduce((s, w) => s + w.utilizationPct, 0) / workCenters.length
      : 0;
    return { workCenters, bottleneckCount, avgUtilization };
  }

  @ApiOperation({ summary: 'Get learning curve' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('learning-curve/:productId')
  @RequirePermission('pp:READ')
  async getLearningCurve(@Param('productId') productId: string) {
    return unwrapOrThrow(await this.svc.getLearningCurve(productId));
  }

}
