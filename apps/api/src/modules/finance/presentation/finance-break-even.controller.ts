/**
 * @module finance-break-even.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Query, Body, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { I18nService } from 'nestjs-i18n';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { BreakEvenService } from '../domain/services/break-even.service';
import { unwrapOrInternal } from '@common/http-result';

const CostStructureSchema = z.object({
  productName:     z.string().min(1),
  period:          z.string().regex(/^\d{4}-\d{2}$/, 'period YYYY-MM formatida bo\'lishi kerak'),
  fixedCostUzs:    z.number().nonnegative(),
  variableCostUzs: z.number().nonnegative(),
  sellingPriceUzs: z.number().positive(),
});

@ApiThrottle()
@ApiTags('Finance Break Even')
@ApiBearerAuth()
@Controller('finance/break-even')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class FinanceBreakEvenController {
  constructor(
    private readonly svc: BreakEvenService,
    private readonly i18n: I18nService,
  ) {}

  @ApiOperation({ summary: 'Analyze' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @RequirePermission('finance.break-even:READ')
  async analyze(
    @Query('productName') productName: string,
    @Query('period') period?: string,
  ) {
    if (!productName?.trim()) {
      throw new BadRequestException(await this.i18n.t('errors.productNameRequired'));
    }
    const eff = period ?? new Date().toISOString().slice(0, 7);
    return unwrapOrInternal(await this.svc.analyze(productName.trim(), eff));
  }

  @ApiOperation({ summary: 'Upsert cost structure' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('cost-structure')
  @RequirePermission('finance.break-even:WRITE')
  async upsertCostStructure(@Body() body: unknown) {
    const dto = CostStructureSchema.parse(body);
    return unwrapOrInternal(await this.svc.upsertCostStructure(dto));
  }
}
