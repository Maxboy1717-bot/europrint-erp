/**
 * @module finance-standard-cost.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Param, Query, Body, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { I18nService } from 'nestjs-i18n';
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

@ApiThrottle()
@ApiTags('Finance Standard Cost')
@ApiBearerAuth()
@Controller('finance/standard-cost')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class FinanceStandardCostController {
  constructor(
    private readonly svc: StandardCostService,
    private readonly i18n: I18nService,
  ) {}

  /** Primary endpoint per task spec: GET /finance/standard-cost/:productId */
  @ApiOperation({ summary: 'Get for product by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':productId')
  @RequirePermission('finance.standard-cost:READ')
  async getForProductById(
    @Param('productId') productIdStr: string,
    @Query('period') period?: string,
  ) {
    const productId = parseInt(productIdStr, 10);
    if (isNaN(productId) || productId <= 0) {
      throw new BadRequestException(await this.i18n.t('errors.productIdMustBePositive'));
    }
    const eff = period ?? new Date().toISOString().slice(0, 7);
    return unwrapOrInternal(await this.svc.getForProductById(productId, eff));
  }

  /** Backward-compatible: GET /finance/standard-cost/name/:productName */
  @ApiOperation({ summary: 'Get for product' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('name/:productName')
  @RequirePermission('finance.standard-cost:READ')
  async getForProduct(
    @Param('productName') productName: string,
    @Query('period') period?: string,
  ) {
    const eff = period ?? new Date().toISOString().slice(0, 7);
    return unwrapOrInternal(await this.svc.getForProduct(productName, eff));
  }

  @ApiOperation({ summary: 'List periods' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('name/:productName/periods')
  @RequirePermission('finance.standard-cost:READ')
  async listPeriods(@Param('productName') productName: string) {
    return unwrapOrInternal(await this.svc.listPeriods(productName));
  }

  @ApiOperation({ summary: 'Calculate' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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
