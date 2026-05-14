/**
 * @module crm-analytics.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Body, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { SodGuard } from '@common/guards/sod.guard';
import { unwrapOrBadRequest } from '@common/http-result';
import { z } from 'zod';
import { FunnelService }       from '../analytics/funnel.service';
import { CohortService }       from '../analytics/cohort.service';
import { KMeansService }       from '../analytics/kmeans.service';
import { ChurnService }        from '../analytics/churn.service';
import { ChurnRetrainService } from '../analytics/churn-retrain.service';

/** Must match FEATURE_NAMES.length in churn-retrain.service.ts */
const CHURN_FEATURE_DIM = 7;

const RfmClusterDto = z.object({
  points: z.array(z.object({
    customerId: z.string().min(1),
    rNorm:      z.number().min(0).max(1),
    fNorm:      z.number().min(0).max(1),
    mNorm:      z.number().min(0).max(1),
  })).min(6),
});

const ChurnRetrainDto = z.object({
  samples: z.array(z.object({
    features: z.array(z.number()).length(CHURN_FEATURE_DIM),
    label:    z.number().min(0).max(1),
  })).min(10),
});

const ChurnPredictDto = z.object({
  rfmRecencyScore:       z.number().min(1).max(5),
  complaintCount:        z.number().min(0).default(0),
  daysSinceLastContact:  z.number().min(0).default(0),
  supportTicketCount:    z.number().min(0).default(0),
  paymentLateCount:      z.number().min(0).default(0),
});

const FunnelQueryDto = z.object({
  pipelineId: z.string().optional(),
});

const CohortQueryDto = z.object({
  months: z.coerce.number().int().positive().max(120).default(12),
  mode:   z.enum(['count', 'revenue']).default('count'),
});

@ApiTags('CRM Analytics')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('crm')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class CrmAnalyticsController {
  constructor(
    private readonly funnelSvc:       FunnelService,
    private readonly cohortSvc:       CohortService,
    private readonly kmeansSvc:       KMeansService,
    private readonly churnSvc:        ChurnService,
    private readonly churnRetrainSvc: ChurnRetrainService,
  ) {}

  @Get('funnel')
  @RequirePermission('crm.analytics:READ')
  @ApiOperation({ summary: 'TZ-42: Win-Rate + Funnel Conversion + Pipeline Velocity' })
  async getFunnel(@Query() q: unknown) {
    const { pipelineId } = FunnelQueryDto.parse(q);
    return this.funnelSvc.composeFunnelData(pipelineId);
  }

  @Get('cohort')
  @RequirePermission('crm.analytics:READ')
  @ApiOperation({ summary: 'TZ-43: Cohort Analysis (Retention Matrix) — ?months=12&mode=count|revenue' })
  async getCohort(@Query() q: unknown) {
    const { months, mode } = CohortQueryDto.parse(q);
    return this.cohortSvc.buildCohortResponse(months, mode);
  }

  @Post('rfm/cluster')
  @RequirePermission('crm.rfm:CLUSTER')
  @UseGuards(SodGuard)
  @ApiOperation({ summary: 'TZ-41: RFM K-Means++ clustering (k=6)' })
  async rfmCluster(@Body() body: unknown) {
    const dto = RfmClusterDto.parse(body);
    return unwrapOrBadRequest(await this.kmeansSvc.cluster(dto.points));
  }

  @Post('churn/predict')
  @RequirePermission('crm.churn:READ')
  @UseGuards(SodGuard)
  @ApiOperation({ summary: 'TZ-44: Churn prediction — uses active DB model if available, else defaults' })
  async churnPredict(@Body() body: unknown) {
    const dto = ChurnPredictDto.parse(body);
    return unwrapOrBadRequest(await this.churnSvc.predictWithActiveModel(dto));
  }

  @Post('churn/retrain')
  @RequirePermission('crm.churn:RETRAIN')
  @UseGuards(SodGuard)
  @ApiOperation({ summary: 'TZ-44: Churn model gradient-descent retrain — features must be exactly 7-dimensional' })
  async churnRetrain(@Body() body: unknown) {
    const dto = ChurnRetrainDto.parse(body);
    return unwrapOrBadRequest(await this.churnRetrainSvc.retrain(dto.samples));
  }
}
