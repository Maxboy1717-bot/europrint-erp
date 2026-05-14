/**
 * @module tiered-pricing.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Ok, Err, AppErr, Result, AppError } from '@common/result';
import { safeNum, roundTo } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { TashkentTimeService } from '@common/time';

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

type Row = Record<string, unknown>;

@Injectable()
export class TieredPricingService {
  private readonly logger = new Logger(TieredPricingService.name);
  private readonly time = new TashkentTimeService();

  @Calculation('tiered-pricing-calculate')
  async calculatePrice(
    productName: string,
    qty: number,
    date?: string,
  ): Promise<Result<PriceCalculationResult, AppError>> {
    try {
      const effectiveDate = date ?? this.time.formatDate(this.time.today());
      const rows = await runQuery<Row>(sql`
        SELECT pt.id::text AS id, pt.product_name, pt.product_id,
               pt.tier_name, pt.min_qty, pt.max_qty, pt.price_uzs,
               pt.valid_from, pt.valid_to
        FROM price_tier pt
        LEFT JOIN products p ON p.id = pt.product_id
        WHERE (pt.product_name = ${productName} OR p.name = ${productName})
          AND pt.min_qty <= ${qty}
          AND (pt.max_qty IS NULL OR pt.max_qty >= ${qty})
          AND pt.valid_from <= ${effectiveDate}::date
          AND (pt.valid_to IS NULL OR pt.valid_to >= ${effectiveDate}::date)
        ORDER BY pt.min_qty DESC
        LIMIT 1
      `);
      const row = rows[0];
      if (!row) {
        return Err(AppErr('NOT_FOUND', `Ushbu miqdor uchun aktiv narx qatlami topilmadi: ${productName} qty=${qty}`));
      }
      const priceUzs = safeNum(row['price_uzs'], 0);
      const productId = row['product_id'] ? Number(row['product_id']) : null;
      return Ok({
        productName,
        productId,
        quantity: qty,
        date: effectiveDate,
        priceUzs:         roundTo(priceUzs, 2),
        tierName:         String(row['tier_name'] ?? ''),
        totalUzs:         roundTo(priceUzs * qty, 2),
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
      const rows = await runQuery<Row>(sql`
        SELECT pt.id::text AS id, pt.product_name, pt.product_id,
               pt.tier_name, pt.min_qty, pt.max_qty,
               pt.price_uzs, pt.valid_from::text AS valid_from, pt.valid_to::text AS valid_to
        FROM price_tier pt
        LEFT JOIN products p ON p.id = pt.product_id
        WHERE pt.product_name = ${productName} OR p.name = ${productName}
        ORDER BY pt.min_qty ASC
      `);
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
      const productRows = await runQuery<Row>(sql`
        SELECT id FROM products WHERE name = ${dto.productName} AND is_active = true LIMIT 1
      `);
      const productId = productRows[0] ? Number(productRows[0]['id']) : null;

      const maxQtyVal  = dto.maxQty ?? null;
      const validToVal = dto.validTo ?? null;

      const rows = productId !== null
        ? await runQuery<Row>(sql`
            INSERT INTO price_tier (product_name, product_id, tier_name, min_qty, max_qty, price_uzs, valid_from, valid_to)
            VALUES (${dto.productName}, ${productId}, ${dto.tierName}, ${dto.minQty}, ${maxQtyVal},
                    ${dto.priceUzs}, ${dto.validFrom}::date, ${validToVal}::date)
            RETURNING id::text AS id, product_name, product_id, tier_name, min_qty, max_qty,
                      price_uzs, valid_from::text AS valid_from, valid_to::text AS valid_to
          `)
        : await runQuery<Row>(sql`
            INSERT INTO price_tier (product_name, tier_name, min_qty, max_qty, price_uzs, valid_from, valid_to)
            VALUES (${dto.productName}, ${dto.tierName}, ${dto.minQty}, ${maxQtyVal},
                    ${dto.priceUzs}, ${dto.validFrom}::date, ${validToVal}::date)
            RETURNING id::text AS id, product_name, product_id, tier_name, min_qty, max_qty,
                      price_uzs, valid_from::text AS valid_from, valid_to::text AS valid_to
          `);

      const row = rows[0];
      if (!row) return Err(AppErr('INTERNAL', 'Narx qatlami saqlanmadi'));
      return Ok(this.toTier(row));
    } catch (err) {
      this.logger.error(`TieredPricingService.upsertTier xato: ${String(err)}`);
      return Err(AppErr('INTERNAL', 'Ichki server xatosi'));
    }
  }

  private toTier(row: Row): PriceTier {
    return {
      id:          String(row['id'] ?? ''),
      productName: String(row['product_name'] ?? ''),
      productId:   row['product_id'] ? Number(row['product_id']) : null,
      tierName:    String(row['tier_name'] ?? ''),
      minQty:      safeNum(row['min_qty'], 0),
      maxQty:      row['max_qty'] != null ? safeNum(row['max_qty'], undefined) ?? null : null,
      priceUzs:    roundTo(safeNum(row['price_uzs'], 0), 2),
      validFrom:   String(row['valid_from'] ?? ''),
      validTo:     row['valid_to'] ? String(row['valid_to']) : null,
    };
  }
}
