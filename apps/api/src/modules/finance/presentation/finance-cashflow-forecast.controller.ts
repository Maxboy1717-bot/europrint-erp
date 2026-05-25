/**
 * @module finance-cashflow-forecast.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CashflowForecastService } from '../domain/services/cashflow-forecast.service';
import { unwrapOrInternal } from '@common/http-result';

@ApiThrottle()
@ApiTags('Finance Cashflow Forecast')
@ApiBearerAuth()
@Controller('finance/cashflow')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class FinanceCashflowForecastController {
  constructor(private readonly svc: CashflowForecastService) {}

  @ApiOperation({ summary: 'Forecast' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('forecast')
  @RequirePermission('finance.cashflow:READ')
  async forecast(@Query('horizon') horizon?: string) {
    const horizonDays = Math.min(Math.max(parseInt(horizon ?? '91', 10) || 91, 7), 364);
    const weeks = Math.ceil(horizonDays / 7);
    return unwrapOrInternal(await this.svc.forecastWeeks(weeks));
  }
}
