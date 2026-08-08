/**
 * @module eoq-calculator.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Calculation } from '@common/decorators/calculation.decorator';
import { safeDiv, safeNum } from '@common/math/math-utils';
import { Ok, Err, Result, AppError } from '@common/result';
import {
  DEFAULT_ORDERING_COST_UZS as EOQ_DEFAULT_ORDERING_COST,
  DEFAULT_HOLDING_COST_PCT as EOQ_DEFAULT_HOLDING_RATE,
} from '../constants/eoq.constants';

const EOQ_PACK_ROUND = 1;

export interface PriceTier {
  minQty: number;
  maxQty?: number;
  unitPrice: number;
}

export interface EoqInput {
  annualDemand: number;
  orderingCostUzs: number;
  holdingCostPercent: number;
  unitPriceUzs: number;
  packSize?: number;
}

export interface EoqWithDiscountInput {
  annualDemand: number;
  orderingCostUzs?: number;
  holdingCostPercent?: number;
  priceTiers: PriceTier[];
  packSize?: number;
}

export interface EoqResult {
  eoq: number;
  eoqRounded: number;
  totalCost: number;
  orderFrequency: number;
  cycleTimeDays: number;
}

export interface EoqDiscountResult extends EoqResult {
  selectedTierPrice: number;
  selectedTierMinQty: number;
}

function makeEoqErr(msg: string): AppError {
  return { code: 'VALIDATION', message: msg };
}

function calcWilsonEoq(D: number, S: number, H: number): number {
  return Math.sqrt(safeDiv(2 * D * S, H));
}

function calcTotalCost(D: number, Q: number, S: number, H: number, c: number): number {
  return safeDiv(D, Q) * S + safeDiv(Q, 2) * H + D * c;
}

function roundToPack(qty: number, packSize: number): number {
  const ps = packSize > 0 ? packSize : EOQ_PACK_ROUND;
  return Math.ceil(qty / ps) * ps;
}

@Injectable()
export class EoqCalculatorService {
  @Calculation('wms.eoq.calculate')
  calculate(input: EoqInput): Result<EoqResult, AppError> {
    const { annualDemand: D, orderingCostUzs: S, holdingCostPercent, unitPriceUzs: P } = input;
    const H = holdingCostPercent * P;

    if (D <= 0) return Err(makeEoqErr('annualDemand musbat bo\'lishi kerak'));
    if (S <= 0) return Err(makeEoqErr('orderingCost musbat bo\'lishi kerak'));
    if (H <= 0) return Err(makeEoqErr('holdingCost musbat bo\'lishi kerak'));

    const eoqRaw = calcWilsonEoq(D, S, H);
    const packSize = input.packSize && input.packSize > 0 ? input.packSize : EOQ_PACK_ROUND;
    const eoqRounded = roundToPack(eoqRaw, packSize);
    const orderFrequency = safeDiv(D, eoqRounded);
    const cycleTimeDays = safeDiv(365, orderFrequency);
    const totalCost = calcTotalCost(D, eoqRounded, S, H, P);

    return Ok({ eoq: eoqRaw, eoqRounded, totalCost, orderFrequency, cycleTimeDays });
  }

  /**
   * TZ-01-b: EOQ All-Units Quantity Discount Model
   * Har bir narx bloki uchun EOQ hisoblanadi, keyin eng arzon tanlanadi.
   */
  @Calculation('wms.eoq.calculateWithDiscounts')
  calculateWithDiscounts(input: EoqWithDiscountInput): Result<EoqDiscountResult, AppError> {
    const {
      annualDemand: D,
      orderingCostUzs: S = EOQ_DEFAULT_ORDERING_COST,
      holdingCostPercent: I = EOQ_DEFAULT_HOLDING_RATE,
      priceTiers,
      packSize = EOQ_PACK_ROUND,
    } = input;

    if (D <= 0) return Err(makeEoqErr('annualDemand musbat bo\'lishi kerak'));
    if (S <= 0) return Err(makeEoqErr('orderingCost musbat bo\'lishi kerak'));
    if (!(priceTiers ?? []).length) return Err(makeEoqErr('priceTiers bo\'sh bo\'lmasin'));

    let bestCost = Infinity;
    let bestQty = 0;
    let bestTier: PriceTier = (priceTiers ?? [])[0];

    for (const tier of priceTiers ?? []) {
      const c = safeNum(tier.unitPrice);
      if (c <= 0) continue;
      const H = I * c;
      const rawEoq = calcWilsonEoq(D, S, H);
      const minQ = safeNum(tier.minQty, 0);
      const maxQ = tier.maxQty != null ? safeNum(tier.maxQty) : Infinity;

      let candidateQ: number;
      if (rawEoq >= minQ && rawEoq <= maxQ) {
        candidateQ = rawEoq;
      } else if (rawEoq < minQ) {
        candidateQ = minQ;
      } else {
        candidateQ = maxQ === Infinity ? rawEoq : maxQ;
      }

      const roundedQ = roundToPack(candidateQ, packSize);
      // After pack-rounding, ensure quantity still falls within this tier's boundary.
      // If rounding pushed it above a finite maxQty, the tier price no longer applies.
      if (maxQ !== Infinity && roundedQ > maxQ) continue;
      const tc = calcTotalCost(D, roundedQ, S, H, c);

      if (tc < bestCost) {
        bestCost = tc;
        bestQty = roundedQ;
        bestTier = tier;
      }
    }

    if (bestQty <= 0) return Err(makeEoqErr('Optimal miqdor hisoblanmadi'));

    const orderFrequency = safeDiv(D, bestQty);
    const cycleTimeDays = safeDiv(365, orderFrequency);

    return Ok({
      eoq: bestQty,
      eoqRounded: bestQty,
      totalCost: bestCost,
      orderFrequency,
      cycleTimeDays,
      selectedTierPrice: safeNum(bestTier.unitPrice),
      selectedTierMinQty: safeNum(bestTier.minQty),
    });
  }

  getDefaultHoldingRate(): number { return EOQ_DEFAULT_HOLDING_RATE; }
  getDefaultOrderingCost(): number { return EOQ_DEFAULT_ORDERING_COST; }
}
