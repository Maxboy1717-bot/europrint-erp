/**
 * @module wms-analytics.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller, Get,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow } from '@common/http-result';
import { WmsAnalyticsService } from '../application/wms-analytics.service';

@ApiThrottle()
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
@ApiTags('Wms Analytics')
@ApiBearerAuth()
@Controller('wms')
export class WmsAnalyticsController {
  constructor(private readonly svc: WmsAnalyticsService) {}

  @ApiOperation({ summary: 'Get inventory turnover' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('inventory-turnover')
  @RequirePermission('wms:READ')
  async getInventoryTurnover() {
    return unwrapOrThrow(await this.svc.getInventoryTurnover());
  }

  @ApiOperation({ summary: 'Get dead stock' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dead-stock')
  @RequirePermission('wms:READ')
  async getDeadStock() {
    return unwrapOrThrow(await this.svc.getDeadStock());
  }

  @ApiOperation({ summary: 'Get rop alerts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('rop-alerts')
  @RequirePermission('wms:READ')
  async getRopAlerts() {
    return unwrapOrThrow(await this.svc.getRopAlerts());
  }
}
