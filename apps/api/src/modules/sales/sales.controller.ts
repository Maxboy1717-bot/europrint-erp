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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SalesService } from './sales.service';

const GenerateForecastSchema = z.object({
  managerId: z.union([z.string(), z.number()]).optional(),
  period: z.string().max(50).optional(),
}).passthrough();

const SALES_ROLES = ['sales_manager', 'SALES', 'director', 'super_admin'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Sales')
@Controller('sales')
@UseGuards(RolesGuard)
@Roles(...SALES_ROLES)
export class SalesController {
  private readonly logger = new Logger(SalesController.name);

  constructor(private readonly svc: SalesService) {}

  @ApiOperation({ summary: 'List invoices' })
  @ApiResponse({ status: 200, description: 'OK' })
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

  @ApiOperation({ summary: 'Get monthly trend' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('analytics/monthly-trend')
  async getMonthlyTrend(@Query('months') months?: string) {
    return unwrapOrThrow(await this.svc.getMonthlyTrend(safeInt(months, 12)));
  }

  @ApiOperation({ summary: 'Get velocity' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('analytics/velocity')
  async getVelocity(@Query('period') period?: string) {
    return unwrapOrThrow(await this.svc.getVelocity(period ?? null));
  }

  @ApiOperation({ summary: 'Get commission calculations' })
  @ApiResponse({ status: 200, description: 'OK' })
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

  @ApiOperation({ summary: 'Get forecast accuracy' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('forecast/accuracy')
  async getForecastAccuracy(@Query('managerId') managerId?: string) {
    return unwrapOrThrow(await this.svc.getForecastAccuracy(managerId ? safeInt(managerId, 0) : null));
  }

  @ApiOperation({ summary: 'Generate forecast' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('forecast/generate')
  async generateForecast(@Query('managerId') managerId?: string, @Query('period') period?: string) {
    const _rGenerateForecast = await this.svc.generateForecast(
      managerId ? safeInt(managerId, 0) : null,
      period ?? null,
    );
    assertOk(_rGenerateForecast);
    return _rGenerateForecast.data;
  }

  @ApiOperation({ summary: 'Post generate forecast' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('forecast/generate')
  @HttpCode(HttpStatus.OK)
  async postGenerateForecast(@Body() body: unknown) {
    const dto = GenerateForecastSchema.parse(body);
    const _rGenerateForecast = await this.svc.generateForecast(
      dto.managerId ? safeInt(String(dto.managerId), 0) : null,
      dto.period ? String(dto.period) : null,
    );
    assertOk(_rGenerateForecast);
    return _rGenerateForecast.data;
  }

  @ApiOperation({ summary: 'Get forecast history' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('forecast/history')
  async getForecastHistory(@Query('managerId') managerId?: string, @Query('limit') limit?: string) {
    const _rGetForecastHistory = await this.svc.getForecastHistory(
      managerId ? safeInt(managerId, 0) : null,
      safeInt(limit, 12),
    );
    assertOk(_rGetForecastHistory);
    return _rGetForecastHistory.data;
  }

  @ApiOperation({ summary: 'Get leaderboard' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('targets/leaderboard')
  async getLeaderboard(@Query('period') period?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.getLeaderboard(period ?? null, safeInt(limit, 20)));
  }
}
