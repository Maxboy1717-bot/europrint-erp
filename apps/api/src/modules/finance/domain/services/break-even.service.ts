/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   TO_CHAR(po.created_at, 'YYYY-MM') = ${period} period bucketing in a JOIN
 *   predicate, and INSERT ... ON CONFLICT (product_name, period) DO UPDATE SET
 *   ... = EXCLUDED.* upsert with composite conflict target.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

/**
 * @module break-even.service
 * @description Break-even and operating-leverage analysis per product per
 *   period. Reads `cost_structure` (fixed cost, variable cost per unit,
 *   selling price) and joins with `production_orders` to compute:
 *
 *     contribution margin (CM) = price − variable cost per unit
 *     break-even qty          = fixed cost / CM            (units to cover FC)
 *     break-even revenue      = fixed cost × price / CM   (UZS at BE)
 *     margin of safety (qty)  = actual qty − break-even qty
 *     margin of safety (%)    = MOS qty / actual qty
 *     degree of operating
 *       leverage (DOL)        = (CM × qty) / (CM × qty − FC)
 *
 *   DOL > 1 means a 1% change in sales produces > 1% change in operating
 *   income — the higher, the more sensitive profit is to volume. Useful
 *   for capacity planning conversations.
 * @layer Domain Service (Finance / CFO dashboard)
 *
 * WHY 10% MOS WARNING THRESHOLD
 *   Industry rule of thumb: <10% margin of safety means a single bad month
 *   can push a product line into operating loss. We flag this so the CFO
 *   can prioritise pricing or cost actions before it actually happens.
 *
 * WHY CONTRIBUTION MARGIN <= 0 IS A HARD ERROR (not just warning)
 *   A product whose unit selling price doesn't cover its variable cost is
 *   guaranteed to lose money on every unit — fixed costs aren't even
 *   covered yet. Break-even math literally divides by CM, so we reject the
 *   input rather than return a nonsensical infinite break-even quantity.
 *
 * WHY DOL DEFAULTS TO 0 WHEN OP-INCOME IS 0
 *   At exact break-even, op-income = 0 and DOL = CM / 0 → undefined. We
 *   return 0 so callers can format it without special-casing; the UI shows
 *   "N/A" when DOL=0 AND mosPct<1% as a safe heuristic.
 */

import { Injectable, Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Ok, Err, AppErr, Result, AppError } from '@common/result';
import { safeDiv, safeNum, roundTo } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';

const BREAK_EVEN_WARN_MOS_PCT = 10;

export interface BreakEvenDto {
  productName: string;
  period: string;
  fixedCostUzs: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
  contributionMargin: number;
  breakEvenQty: number;
  breakEvenRevenue: number;
  marginOfSafetyQty: number;
  marginOfSafetyPct: number;
  degreesOfOperatingLeverage: number;
  actualSalesQty: number;
  warning: string | null;
}

type Row = Record<string, unknown>;

@Injectable()
export class BreakEvenService {
  private readonly logger = new Logger(BreakEvenService.name);

  @Calculation('break-even-analyze')
  async analyze(productName: string, period: string): Promise<Result<BreakEvenDto, AppError>> {
    try {
      const [structRows, salesRows] = await Promise.all([
        runQuery<Row>(sql`
          SELECT fixed_cost_uzs, variable_cost_uzs, selling_price_uzs
          FROM cost_structure
          WHERE product_name = ${productName} AND period = ${period}
          LIMIT 1
        `),
        runQuery<Row>(sql`
          SELECT COALESCE(SUM(po.planned_quantity), 0)::numeric AS actual_qty
          FROM production_orders po
          JOIN products p ON p.id = po.product_id
          WHERE p.name = ${productName}
            AND po.status::text = 'completed'
            AND TO_CHAR(po.created_at, 'YYYY-MM') = ${period}
        `),
      ]);

      const struct = structRows[0];
      if (!struct) {
        return Err(AppErr('NOT_FOUND', `Xarajat tuzilmasi topilmadi: ${productName} / ${period}. Avval cost_structure yozing.`));
      }

      const fc = safeNum(struct['fixed_cost_uzs'], 0);
      const vc = safeNum(struct['variable_cost_uzs'], 0);
      const p  = safeNum(struct['selling_price_uzs'], 0);

      if (p <= 0) return Err(AppErr('BAD_REQUEST', 'Sotuv narxi 0 dan katta bo\'lishi kerak'));

      const cm = p - vc;
      if (cm <= 0) {
        return Err(AppErr('BAD_REQUEST', 'Contribution margin manfiy — bu mahsulot sotuv narxi VC dan past'));
      }

      const actualQty = safeNum(salesRows[0]?.['actual_qty'], 0);
      const bepQty    = roundTo(safeDiv(fc, cm), 2);
      const bepRev    = roundTo(safeDiv(fc * p, cm), 2);
      const mosQty    = roundTo(actualQty - bepQty, 2);
      const mosPct    = actualQty > 0 ? roundTo(safeDiv(mosQty, actualQty) * 100, 2) : 0;
      const cmTotal   = cm * actualQty;
      const netOpInc  = cmTotal - fc;
      const dol       = netOpInc !== 0 ? roundTo(safeDiv(cmTotal, netOpInc), 4) : 0;

      const warning = mosPct < BREAK_EVEN_WARN_MOS_PCT && mosPct >= 0
        ? `Ogohlantirish: Xavfsizlik chekkasi ${mosPct.toFixed(1)}% — 10% dan past`
        : null;

      return Ok({
        productName, period,
        fixedCostUzs:               roundTo(fc, 2),
        variableCostPerUnit:         roundTo(vc, 2),
        sellingPricePerUnit:         roundTo(p, 2),
        contributionMargin:          roundTo(cm, 2),
        breakEvenQty:                bepQty,
        breakEvenRevenue:            bepRev,
        marginOfSafetyQty:           mosQty,
        marginOfSafetyPct:           mosPct,
        degreesOfOperatingLeverage:  dol,
        actualSalesQty:              actualQty,
        warning,
      });
    } catch (err) {
      this.logger.error(`BreakEvenService.analyze xato: ${String(err)}`);
      return Err('Ichki server xatosi');
    }
  }

  @Calculation('break-even-upsert-structure')
  async upsertCostStructure(dto: {
    productName: string;
    period: string;
    fixedCostUzs: number;
    variableCostUzs: number;
    sellingPriceUzs: number;
  }): Promise<Result<void, AppError>> {
    try {
      const { productName, period, fixedCostUzs, variableCostUzs, sellingPriceUzs } = dto;
      await runQuery(sql`
        INSERT INTO cost_structure (product_name, period, fixed_cost_uzs, variable_cost_uzs, selling_price_uzs)
        VALUES (${productName}, ${period}, ${fixedCostUzs}, ${variableCostUzs}, ${sellingPriceUzs})
        ON CONFLICT (product_name, period) DO UPDATE
          SET fixed_cost_uzs    = EXCLUDED.fixed_cost_uzs,
              variable_cost_uzs = EXCLUDED.variable_cost_uzs,
              selling_price_uzs = EXCLUDED.selling_price_uzs,
              updated_at        = now()
      `);
      return Ok(undefined);
    } catch (err) {
      this.logger.error(`BreakEvenService.upsertCostStructure xato: ${String(err)}`);
      return Err('Ichki server xatosi');
    }
  }
}
