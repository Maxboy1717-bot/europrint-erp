/**
 * @module sales.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  AuditInterceptor } from '@common/interceptors/audit.interceptor';import { safeInt } from '../hr/common/db-rows';import {  Body, Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  InternalServerErrorException,
} from '@nestjs/common';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SalesService } from './sales.service';

const SALES_ROLES = ['sales_manager', 'SALES', 'director', 'super_admin'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('sales')
@UseGuards(RolesGuard)
@Roles(...SALES_ROLES)
export class SalesController {
  private readonly logger = new Logger(SalesController.name);

  constructor(private readonly svc: SalesService) {}

  @Get('invoices')
  async listInvoices(
    @Query('customerId') customerId?: string, @Query('status') status?: string,
    @Query('limit') limit?: string, @Query('offset') offset?: string,
  ) {
    const _rListInvoices = await this.svc.listInvoices(
      customerId ? safeInt(customerId, 0) : null,
      status ?? null,
      safeInt(limit, 50), safeInt(offset, 0),
    );
    assertOk(_rListInvoices);
    return _rListInvoices.data;
  }

  @Get('analytics/monthly-trend')
  async getMonthlyTrend(@Query('months') months?: string) {
    return unwrapOrThrow(await this.svc.getMonthlyTrend(safeInt(months, 12)));
  }

  @Get('analytics/velocity')
  async getVelocity(@Query('period') period?: string) {
    return unwrapOrThrow(await this.svc.getVelocity(period ?? null));
  }

  @Get('commission/calculations')
  async getCommissionCalculations(
    @Query('managerId') managerId?: string, @Query('period') period?: string,
  ) {
    const _rGetCommissionCalculations = await this.svc.getCommissionCalculations(
      managerId ? safeInt(managerId, 0) : null,
      period ?? null,
    );
    assertOk(_rGetCommissionCalculations);
    return _rGetCommissionCalculations.data;
  }

  @Get('forecast/accuracy')
  async getForecastAccuracy(@Query('managerId') managerId?: string) {
    return unwrapOrThrow(await this.svc.getForecastAccuracy(managerId ? safeInt(managerId, 0) : null));
  }

  @Get('forecast/generate')
  async generateForecast(@Query('managerId') managerId?: string, @Query('period') period?: string) {
    const _rGenerateForecast = await this.svc.generateForecast(
      managerId ? safeInt(managerId, 0) : null,
      period ?? null,
    );
    assertOk(_rGenerateForecast);
    return _rGenerateForecast.data;
  }

  @Post('forecast/generate')
  @HttpCode(HttpStatus.OK)
  async postGenerateForecast(@Body() body: Record<string, unknown>) {
    const _rGenerateForecast = await this.svc.generateForecast(
      body.managerId ? safeInt(String(body.managerId), 0) : null,
      body.period ? String(body.period) : null,
    );
    assertOk(_rGenerateForecast);
    return _rGenerateForecast.data;
  }

  @Get('forecast/history')
  async getForecastHistory(@Query('managerId') managerId?: string, @Query('limit') limit?: string) {
    const _rGetForecastHistory = await this.svc.getForecastHistory(
      managerId ? safeInt(managerId, 0) : null,
      safeInt(limit, 12),
    );
    assertOk(_rGetForecastHistory);
    return _rGetForecastHistory.data;
  }

  @Get('targets/leaderboard')
  async getLeaderboard(@Query('period') period?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.getLeaderboard(period ?? null, safeInt(limit, 20)));
  }
}
