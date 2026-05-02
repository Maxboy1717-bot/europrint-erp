import { Controller, Get, Post, Param, Query, Body, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { StandardCostService } from '../domain/services/standard-cost.service';
import { unwrapOrInternal } from '@common/http-result';

const CalcSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'period YYYY-MM formatida bo\'lishi kerak'),
});

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('finance/standard-cost')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class FinanceStandardCostController {
  constructor(private readonly svc: StandardCostService) {}

  /** Primary endpoint per task spec: GET /finance/standard-cost/:productId */
  @Get(':productId')
  @RequirePermission('finance.standard-cost:READ')
  async getForProductById(
    @Param('productId') productIdStr: string,
    @Query('period') period?: string,
  ) {
    const productId = parseInt(productIdStr, 10);
    if (isNaN(productId) || productId <= 0) {
      throw new BadRequestException('productId musbat butun son bo\'lishi kerak');
    }
    const eff = period ?? new Date().toISOString().slice(0, 7);
    return unwrapOrInternal(await this.svc.getForProductById(productId, eff));
  }

  /** Backward-compatible: GET /finance/standard-cost/name/:productName */
  @Get('name/:productName')
  @RequirePermission('finance.standard-cost:READ')
  async getForProduct(
    @Param('productName') productName: string,
    @Query('period') period?: string,
  ) {
    const eff = period ?? new Date().toISOString().slice(0, 7);
    return unwrapOrInternal(await this.svc.getForProduct(productName, eff));
  }

  @Get('name/:productName/periods')
  @RequirePermission('finance.standard-cost:READ')
  async listPeriods(@Param('productName') productName: string) {
    return unwrapOrInternal(await this.svc.listPeriods(productName));
  }

  @Post('name/:productName/calculate')
  @RequirePermission('finance.standard-cost:WRITE')
  async calculate(
    @Param('productName') productName: string,
    @Body() body: unknown,
  ) {
    const dto = CalcSchema.parse(body);
    return unwrapOrInternal(await this.svc.calculateAndSave(productName, dto.period));
  }
}
