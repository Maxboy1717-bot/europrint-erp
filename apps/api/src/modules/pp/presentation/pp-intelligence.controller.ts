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
import type { EnrichedMrpResult } from '../application/services/pp-intelligence.service';
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
    return this.formatMrpResponse(result, input.lotSizingMethod ?? 'L4L', input.horizonPeriods ?? 12);
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

  private formatMrpResponse(result: EnrichedMrpResult, method: string, horizon: number) {
    type PeriodCell = { grossReq: number; scheduledReceipts: number; netReq: number; projectedOnHand: number; plannedOrders: number };
    const emptyPeriods = (): PeriodCell[] => Array.from({ length: horizon }, () => ({ grossReq: 0, scheduledReceipts: 0, netReq: 0, projectedOnHand: 0, plannedOrders: 0 }));
    const byMaterial = new Map<string, PeriodCell[]>();

    for (const nr of result.netRequirements ?? []) {
      let periods = byMaterial.get(nr.materialId);
      if (!periods) {
        periods = emptyPeriods();
        byMaterial.set(nr.materialId, periods);
      }
      const idx = Math.min(Math.max(0, nr.period), horizon - 1);
      const p = periods[idx];
      if (!p) continue;
      p.grossReq = nr.gr; p.netReq = nr.nr; p.scheduledReceipts += nr.sr;
    }
    for (const po of result.plannedOrders ?? []) {
      let periods = byMaterial.get(po.materialId);
      if (!periods) {
        periods = emptyPeriods();
        byMaterial.set(po.materialId, periods);
      }
      const idx = Math.min(Math.max(0, po.periodIndex), horizon - 1);
      const p = periods[idx];
      if (!p) continue;
      p.plannedOrders += po.qty;
    }
    for (const [materialId, periods] of byMaterial) {
      let poh = result.openingOnHand[materialId] ?? 0;
      for (const p of periods) { poh = poh + p.scheduledReceipts + p.plannedOrders - p.grossReq; p.projectedOnHand = poh; }
    }

    const policyMap = new Map((Array.isArray(result.policies) ? result.policies : []).map((p) => [p.materialId, p]));
    const lines = Array.from(byMaterial.entries()).map(([materialId, periods]) => {
      const policy = policyMap.get(materialId);
      return {
        itemId: materialId,
        itemName: materialId,
        lotSizingMethod: policy?.lotSizingMethod ?? method,
        safetyStock: policy?.safetyStock ?? 0,
        leadTimePeriods: Math.max(1, Math.ceil((policy?.leadTimeDays ?? 7) / 7)),
        periods,
      };
    });

    return { method, horizon, lines, runAt: result.runAt };
  }
}
