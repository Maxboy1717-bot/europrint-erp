/**
 * @module cashflow.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Body, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CashflowService } from '../cashflow/cashflow.service';
import { CreateCashflowTransactionSchema } from './dto/finance-dtos';
import { unwrapOrInternal } from '@common/http-result';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('cashflow')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR')
export class CashflowController {
  constructor(private readonly svc: CashflowService) {}

  @Get('transactions')
  async getTransactions(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findTransactions(query));
  }

  @Post('transactions')
  async createTransaction(@Body() body: Record<string, unknown>) {
    const dto = CreateCashflowTransactionSchema.parse(body);
    return unwrapOrInternal(await this.svc.createTransaction(dto as Record<string, unknown>));
  }

  @Get('daily-summary')
  async getDailySummary(@Query('date') date?: string) {
    return unwrapOrInternal(await this.svc.findDailySummary(date));
  }

  @Get('forecast')
  async getForecast(@Query('days') days?: string) {
    return unwrapOrInternal(await this.svc.findForecast(days ? Number(days) : undefined));
  }
}
