import {
  Controller, Get,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrThrow } from '@common/http-result';
import { WmsAnalyticsService } from '../application/wms-analytics.service';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
@Controller('wms')
export class WmsAnalyticsController {
  constructor(private readonly svc: WmsAnalyticsService) {}

  @Get('inventory-turnover')
  @RequirePermission('wms:READ')
  async getInventoryTurnover() {
    return unwrapOrThrow(await this.svc.getInventoryTurnover());
  }

  @Get('dead-stock')
  @RequirePermission('wms:READ')
  async getDeadStock() {
    return unwrapOrThrow(await this.svc.getDeadStock());
  }

  @Get('rop-alerts')
  @RequirePermission('wms:READ')
  async getRopAlerts() {
    return unwrapOrThrow(await this.svc.getRopAlerts());
  }
}
