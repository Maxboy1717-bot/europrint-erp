import { Controller, Get, Post, Query, Body, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('finance/break-even')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class FinanceBreakEvenController {
  constructor(private readonly svc: BreakEvenService) {}

  @Get()
  @RequirePermission('finance.break-even:READ')
  async analyze(
    @Query('productName') productName: string,
    @Query('period') period?: string,
  ) {
    if (!productName?.trim()) {
      throw new BadRequestException('productName query parametri majburiy');
    }
    const eff = period ?? new Date().toISOString().slice(0, 7);
    return unwrapOrInternal(await this.svc.analyze(productName.trim(), eff));
  }

  @Post('cost-structure')
  @RequirePermission('finance.break-even:WRITE')
  async upsertCostStructure(@Body() body: unknown) {
    const dto = CostStructureSchema.parse(body);
    return unwrapOrInternal(await this.svc.upsertCostStructure(dto));
  }
}
