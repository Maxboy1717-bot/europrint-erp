/**
 * @module finance-cashflow-forecast.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CashflowForecastService } from '../domain/services/cashflow-forecast.service';
import { unwrapOrInternal } from '@common/http-result';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('finance/cashflow')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class FinanceCashflowForecastController {
  constructor(private readonly svc: CashflowForecastService) {}

  @Get('forecast')
  @RequirePermission('finance.cashflow:READ')
  async forecast(@Query('horizon') horizon?: string) {
    const horizonDays = Math.min(Math.max(parseInt(horizon ?? '91', 10) || 91, 7), 364);
    const weeks = Math.ceil(horizonDays / 7);
    return unwrapOrInternal(await this.svc.forecastWeeks(weeks));
  }
}
