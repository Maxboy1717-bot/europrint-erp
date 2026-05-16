/**
 * @module tiered-pricing.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * Domain-layer service — MUST NOT import Drizzle / @shared/db. Persistence
 * is delegated to IFinanceRepo (see P0-2 DDD audit).
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { Ok, Err, AppErr, Result, AppError } from '@common/result';
import { roundTo } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { TashkentTimeService } from '@common/time';
import { FINANCE_REPO, IFinanceRepo, PriceTierRow } from '../repositories/i-finance.repo';

export interface PriceTier {
  id: string;
  productName: string;
  productId: number | null;
  tierName: string;
  minQty: number;
  maxQty: number | null;
  priceUzs: number;
  validFrom: string;
  validTo: string | null;
}

export interface PriceCalculationResult {
  productName: string;
  productId: number | null;
  quantity: number;
  date: string;
  priceUzs: number;
  tierName: string;
  totalUzs: number;
  savingsVsListPct: number | null;
}

@Injectable()
export class TieredPricingService {
  private readonly logger = new Logger(TieredPricingService.name);
  private readonly time = new TashkentTimeService();

  constructor(@Inject(FINANCE_REPO) private readonly repo: IFinanceRepo) {}

  @Calculation('tiered-pricing-calculate')
  async calculatePrice(
    productName: string,
    qty: number,
    date?: string,
  ): Promise<Result<PriceCalculationResult, AppError>> {
    try {
      const effectiveDate = date ?? this.time.formatDate(this.time.today());
      const row = await this.repo.findPriceTierForQty(productName, qty, effectiveDate);
      if (!row) {
        return Err(AppErr('NOT_FOUND', `Ushbu miqdor uchun aktiv narx qatlami topilmadi: ${productName} qty=${qty}`));
      }
      return Ok({
        productName,
        productId: row.productId,
        quantity: qty,
        date: effectiveDate,
        priceUzs:         roundTo(row.priceUzs, 2),
        tierName:         row.tierName,
        totalUzs:         roundTo(row.priceUzs * qty, 2),
        savingsVsListPct: null,
      });
    } catch (err) {
      this.logger.error(`TieredPricingService.calculatePrice xato: ${String(err)}`);
      return Err(AppErr('INTERNAL', 'Ichki server xatosi'));
    }
  }

  @Calculation('tiered-pricing-list')
  async listTiers(productName: string): Promise<Result<PriceTier[], AppError>> {
    try {
      const rows = await this.repo.listPriceTiers(productName);
      return Ok(rows.map(r => this.toTier(r)));
    } catch (err) {
      this.logger.error(`TieredPricingService.listTiers xato: ${String(err)}`);
      return Err(AppErr('INTERNAL', 'Ichki server xatosi'));
    }
  }

  @Calculation('tiered-pricing-upsert')
  async upsertTier(dto: {
    productName: string;
    tierName: string;
    minQty: number;
    maxQty?: number;
    priceUzs: number;
    validFrom: string;
    validTo?: string;
  }): Promise<Result<PriceTier, AppError>> {
    try {
      const row = await this.repo.upsertPriceTier({
        productName: dto.productName,
        tierName:    dto.tierName,
        minQty:      dto.minQty,
        maxQty:      dto.maxQty ?? null,
        priceUzs:    dto.priceUzs,
        validFrom:   dto.validFrom,
        validTo:     dto.validTo ?? null,
      });
      if (!row) return Err(AppErr('INTERNAL', 'Narx qatlami saqlanmadi'));
      return Ok(this.toTier(row));
    } catch (err) {
      this.logger.error(`TieredPricingService.upsertTier xato: ${String(err)}`);
      return Err(AppErr('INTERNAL', 'Ichki server xatosi'));
    }
  }

  private toTier(row: PriceTierRow): PriceTier {
    return {
      id:          row.id,
      productName: row.productName,
      productId:   row.productId,
      tierName:    row.tierName,
      minQty:      row.minQty,
      maxQty:      row.maxQty,
      priceUzs:    roundTo(row.priceUzs, 2),
      validFrom:   row.validFrom,
      validTo:     row.validTo,
    };
  }
}
