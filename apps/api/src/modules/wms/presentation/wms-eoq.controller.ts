/**
 * @module wms-eoq.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller, Post, Body, HttpCode,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow } from '@common/http-result';
import { z } from 'zod';
import { WmsEoqService } from '../application/wms-eoq.service';

const PriceTierSchema = z.object({
  minQty: z.number().nonnegative(),
  maxQty: z.number().positive().optional(),
  unitPrice: z.number().positive(),
});

const EoqCalculateSchema = z.object({
  annualDemand: z.number().positive(),
  orderingCostUzs: z.number().positive().optional(),
  holdingCostPercent: z.number().positive().max(1).optional(),
  priceTiers: z.array(PriceTierSchema).min(1),
  packSize: z.number().positive().optional(),
});

@ApiThrottle()
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
@ApiTags('Wms Eoq')
@ApiBearerAuth()
@Controller('wms/eoq')
export class WmsEoqController {
  constructor(private readonly svc: WmsEoqService) {}

  @ApiOperation({ summary: 'Calculate eoq' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('calculate')
  @HttpCode(200)
  @RequirePermission('wms:WRITE')
  async calculateEoq(@Body() body: unknown) {
    const input = EoqCalculateSchema.parse(body);
    return unwrapOrThrow(await Promise.resolve(this.svc.calculateWithTiers(input)));
  }

  @ApiOperation({ summary: 'Recalculate all' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('recalculate-all')
  @HttpCode(202)
  @RequirePermission('wms:WRITE')
  async recalculateAll() {
    return this.svc.enqueueRecalculation();
  }
}
