/**
 * @module general-tax.service
 * @description Per-company configurable tax calculator (VAT, sales tax, or
 *   any percentage-based tax line). Rates live in `tax_rate_config` with
 *   effective-from/to dates so the calculator returns the correct rate for
 *   any historical or forward-dated transaction.
 *
 *   Two modes:
 *     INCLUSIVE — price already includes tax (typical for UZ retail prices)
 *         tax  = total × rate / (1 + rate)
 *         base = total − tax
 *
 *     EXCLUSIVE — price quoted before tax (typical for B2B contracts)
 *         tax   = base × rate
 *         total = base + tax
 * @layer Service (FI / tax)
 *
 * WHY RATES ARE DB-DRIVEN, NEVER HARDCODED
 *   Uzbek tax law changed three times between 2020-2024 (12% → 15% → 12%
 *   for general VAT, then the simplified-tax regime for SMEs). Hardcoding
 *   would force a code deploy + retroactive recalculation every change.
 *   With `tax_rate_config`:
 *     - Each rate row carries `effectiveFrom` and `effectiveTo`
 *     - Historical recalculations match what was billed at the time
 *     - New rates can be queued ahead of effective date
 *
 *   Companies on simplified taxation (1% turnover tax) and companies on the
 *   general regime (12% VAT) live in the same table — `companyId` selects.
 *
 * WHY INCLUSIVE/EXCLUSIVE BOTH SUPPORTED
 *   Retail quotes are inclusive ("999,000 UZS *all-in*"). B2B contracts are
 *   exclusive ("999,000 UZS + 12% VAT"). The same invoice template needs both
 *   modes depending on counterparty, so the math is centralised here rather
 *   than per-caller.
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { Ok, Err, Result, AppError } from '@common/result';
import { runQuery } from '@shared/db';
import { Calculation } from '@common/decorators/calculation.decorator';

export type TaxRateType = 'INCLUSIVE' | 'EXCLUSIVE';

export interface TaxRateConfig {
  id: string;
  companyId: string;
  rateType: TaxRateType;
  rate: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

export interface TaxBreakdownResult {
  base: number;
  tax: number;
  total: number;
  rate: number;
  rateType: TaxRateType;
}

@Injectable()
export class GeneralTaxService {
  private readonly logger = new Logger(GeneralTaxService.name);

  /**
   * tax_rate_config jadvalidan faol stavkani yuklash.
   * Shartlar: companyId mos, effectiveFrom <= asOf, effectiveTo NULL yoki >= asOf
   */
  @Calculation('fi.tax.loadActiveRate')
  async loadActiveRate(
    companyId: string,
    asOf: Date = new Date(),
  ): Promise<Result<TaxRateConfig, AppError>> {
    type ConfigRow = {
      id: string;
      company_id: string;
      rate_type: string;
      rate: string;
      effective_from: string;
      effective_to: string | null;
    };

    const rows = await runQuery<ConfigRow>(sql`
      SELECT id, company_id, rate_type, rate::text, effective_from, effective_to
      FROM tax_rate_config
      WHERE company_id = ${companyId}
        AND effective_from <= ${asOf}
        AND (effective_to IS NULL OR effective_to >= ${asOf})
      ORDER BY effective_from DESC
      LIMIT 1
    `);

    if (!rows.length) {
      return Err({ code: 'NOT_FOUND', message: `${companyId} uchun ${asOf.toISOString()} sanada faol soliq stavkasi topilmadi` });
    }

    const row = rows[0];
    return Ok({
      id: row.id,
      companyId: row.company_id,
      rateType: row.rate_type as TaxRateType,
      rate: parseFloat(row.rate),
      effectiveFrom: new Date(row.effective_from),
      effectiveTo: row.effective_to ? new Date(row.effective_to) : null,
    });
  }

  /**
   * Soliq hisoblash — sof sinxron.
   * INCLUSIVE: tax = total × rate/(1+rate), base = total − tax
   * EXCLUSIVE: tax = base × rate, total = base + tax
   */
  calculate(
    amount: number,
    config: Pick<TaxRateConfig, 'rate' | 'rateType'>,
  ): Result<TaxBreakdownResult, AppError> {
    if (amount < 0) {
      return Err({ code: 'VALIDATION', message: 'Summa manfiy bo\'lmasligi kerak' });
    }
    if (config.rate < 0 || config.rate > 1) {
      return Err({ code: 'VALIDATION', message: 'Stavka [0, 1] oralig\'ida bo\'lishi kerak' });
    }

    let base: number;
    let tax: number;
    let total: number;

    if (config.rateType === 'INCLUSIVE') {
      // Umumiy summadan soliq ajratiladi: tax = total × rate/(1+rate)
      total = amount;
      tax   = total * config.rate / (1 + config.rate);
      base  = total - tax;
    } else {
      // EXCLUSIVE: soliqa asosga qo'shiladi: tax = base × rate
      base  = amount;
      tax   = base * config.rate;
      total = base + tax;
    }

    return Ok({
      base:     Math.round(base   * 100) / 100,
      tax:      Math.round(tax    * 100) / 100,
      total:    Math.round(total  * 100) / 100,
      rate:     config.rate,
      rateType: config.rateType,
    });
  }

  /**
   * Bir nechta moddalar (satrlari) uchun soliq hisoblash.
   * Har bir satr uchun mustaqil calculate() chaqiriladi.
   */
  calculateBatch(
    lines: Array<{ amount: number; config: Pick<TaxRateConfig, 'rate' | 'rateType'> }>,
  ): Result<TaxBreakdownResult[], AppError> {
    const results: TaxBreakdownResult[] = [];
    for (const line of lines) {
      const r = this.calculate(line.amount, line.config);
      if (!r.ok) return r as Result<TaxBreakdownResult[], AppError>;
      results.push(r.data);
    }
    return Ok(results);
  }
}
