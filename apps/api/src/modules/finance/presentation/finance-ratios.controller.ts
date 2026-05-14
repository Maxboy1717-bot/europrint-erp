/**
 * @module finance-ratios.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FinancialRatiosService } from '../domain/services/financial-ratios.service';
import { unwrapOrInternal } from '@common/http-result';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('finance/ratios')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class FinanceRatiosController {
  constructor(private readonly svc: FinancialRatiosService) {}

  @Get()
  @RequirePermission('finance.ratios:READ')
  async getRatios(@Query('period') period?: string) {
    const eff = period ?? new Date().toISOString().slice(0, 7);
    return unwrapOrInternal(await this.svc.computeForPeriod(eff));
  }
}
