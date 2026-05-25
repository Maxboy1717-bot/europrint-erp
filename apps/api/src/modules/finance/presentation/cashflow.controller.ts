/**
 * @module cashflow.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Body, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CashflowService } from '../cashflow/cashflow.service';
import { CreateCashflowTransactionSchema } from './dto/finance-dtos';
import { unwrapOrInternal } from '@common/http-result';

@ApiThrottle()
@ApiTags('Cashflow')
@Controller('cashflow')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR')
export class CashflowController {
  constructor(private readonly svc: CashflowService) {}

  @ApiOperation({ summary: 'Get transactions' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('transactions')
  async getTransactions(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findTransactions(query));
  }

  @ApiOperation({ summary: 'Create transaction' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('transactions')
  async createTransaction(@Body() body: unknown) {
    const dto = CreateCashflowTransactionSchema.parse(body);
    return unwrapOrInternal(await this.svc.createTransaction(dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Get daily summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('daily-summary')
  async getDailySummary(@Query('date') date?: string) {
    return unwrapOrInternal(await this.svc.findDailySummary(date));
  }

  @ApiOperation({ summary: 'Get forecast' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('forecast')
  async getForecast(@Query('days') days?: string) {
    return unwrapOrInternal(await this.svc.findForecast(days ? Number(days) : undefined));
  }
}
