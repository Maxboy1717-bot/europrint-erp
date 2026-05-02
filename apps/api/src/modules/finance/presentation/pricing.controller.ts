import { Controller, Get, Post, Param, Query, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { TieredPricingService } from '../domain/services/tiered-pricing.service';
import { unwrapOrInternal } from '@common/http-result';

const PriceCalcSchema = z.object({
  productName: z.string().min(1),
  quantity:    z.number().int().positive(),
  date:        z.string().optional(),
});

const TierUpsertSchema = z.object({
  productName: z.string().min(1),
  tierName:    z.string().min(1).max(50),
  minQty:      z.number().int().nonnegative(),
  maxQty:      z.number().int().positive().optional(),
  priceUzs:    z.number().positive(),
  validFrom:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  validTo:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('pricing')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class PricingController {
  constructor(private readonly svc: TieredPricingService) {}

  @Post('calculate')
  @RequirePermission('pricing.tiers:READ')
  async calculatePrice(@Body() body: unknown) {
    const dto = PriceCalcSchema.parse(body);
    return unwrapOrInternal(await this.svc.calculatePrice(dto.productName, dto.quantity, dto.date));
  }

  @Get('tiers/:productName')
  @RequirePermission('pricing.tiers:READ')
  async listTiers(@Param('productName') productName: string) {
    return unwrapOrInternal(await this.svc.listTiers(productName));
  }

  @Post('tiers')
  @RequirePermission('pricing.tiers:WRITE')
  async upsertTier(@Body() body: unknown) {
    const dto = TierUpsertSchema.parse(body);
    return unwrapOrInternal(await this.svc.upsertTier(dto));
  }
}
