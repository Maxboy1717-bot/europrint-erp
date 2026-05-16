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
 * Domain-layer service — MUST NOT import Drizzle / @shared/db. Persistence
 * is delegated to IFinanceRepo (see P0-2 DDD audit).
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

import { Injectable, Inject, Logger } from '@nestjs/common';
import { Ok, Err, AppErr, Result, AppError } from '@common/result';
import { safeDiv, roundTo } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { FINANCE_REPO, IFinanceRepo } from '../repositories/i-finance.repo';

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

@Injectable()
export class BreakEvenService {
  private readonly logger = new Logger(BreakEvenService.name);

  constructor(@Inject(FINANCE_REPO) private readonly repo: IFinanceRepo) {}

  @Calculation('break-even-analyze')
  async analyze(productName: string, period: string): Promise<Result<BreakEvenDto, AppError>> {
    try {
      const inputs = await this.repo.fetchBreakEvenInputs(productName, period);

      if (!inputs.costStructure) {
        return Err(AppErr('NOT_FOUND', `Xarajat tuzilmasi topilmadi: ${productName} / ${period}. Avval cost_structure yozing.`));
      }

      const fc = inputs.costStructure.fixedCostUzs;
      const vc = inputs.costStructure.variableCostUzs;
      const p  = inputs.costStructure.sellingPriceUzs;

      if (p <= 0) return Err(AppErr('BAD_REQUEST', 'Sotuv narxi 0 dan katta bo\'lishi kerak'));

      const cm = p - vc;
      if (cm <= 0) {
        return Err(AppErr('BAD_REQUEST', 'Contribution margin manfiy — bu mahsulot sotuv narxi VC dan past'));
      }

      const actualQty = inputs.actualQty;
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
      await this.repo.upsertCostStructure(dto);
      return Ok(undefined);
    } catch (err) {
      this.logger.error(`BreakEvenService.upsertCostStructure xato: ${String(err)}`);
      return Err('Ichki server xatosi');
    }
  }
}
