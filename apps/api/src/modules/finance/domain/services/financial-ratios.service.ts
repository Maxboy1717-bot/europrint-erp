/**
 * @module financial-ratios.service
 * @description CFO-dashboard ratio calculator. Reads period balance-sheet
 *   and P&L rows and computes the four canonical ratio families:
 *
 *     LIQUIDITY     currentRatio, quickRatio, cashRatio, workingCapital
 *     PROFITABILITY gross-margin %, net-margin %, ROA, ROE, ROCE
 *     LEVERAGE      debt-to-equity, interest coverage
 *     ALTMAN Z      bankruptcy-prediction composite (1968 Z-score)
 *
 *   All ratios returned in one DTO so the dashboard renders in a single
 *   round-trip. NULL-safe — missing inputs become 0 via `safeNum`/`safeDiv`.
 * @layer Domain Service (Finance / CFO)
 *
 * Domain-layer service — MUST NOT import Drizzle / @shared/db. Persistence
 * is delegated to IFinanceRepo (see P0-2 DDD audit).
 *
 * WHY ALTMAN Z-SCORE COEFFICIENTS ARE FROZEN AT 1968 VALUES
 *   The Altman Z is calibrated for *publicly-traded manufacturing firms*.
 *   The coefficients (1.2 / 1.4 / 3.3 / 0.6 / 1.0) and zone cut-offs
 *   (2.99 safe / 1.81 distress) are NOT tuneable — they were fitted on the
 *   original 1968 distressed-vs-healthy sample. Adjusting them invalidates
 *   the model. If our risk team ever switches to Z' (private companies) or
 *   Z'' (non-manufacturing), it requires a different formula entirely, not
 *   tweaked constants — make it a new method.
 *
 *   References:
 *     Altman (1968), "Financial Ratios, Discriminant Analysis and the
 *     Prediction of Corporate Bankruptcy", Journal of Finance.
 *
 * WHY WE COMPUTE ALL RATIOS IN ONE METHOD, NOT ONE-PER-RATIO
 *   They share the same source rows (balance sheet + P&L). Computing them
 *   separately would re-query the same tables. The dashboard always shows
 *   the full panel, so one fetch + many ratios is the right tradeoff.
 *
 * WHY interestCoverage CAN BE null
 *   For companies without debt (or with 0 interest expense in a period),
 *   interest coverage = EBIT / 0 is undefined. We return `null` and the UI
 *   shows "N/A" — communicating "no debt service to cover" instead of "∞".
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { Ok, Err, AppErr, Result, AppError } from '@common/result';
import { safeDiv, roundTo } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { CfoConfigService } from './cfo-config.service';
import { FINANCE_REPO, IFinanceRepo } from '../repositories/i-finance.repo';

// Altman 1968 coefficients for publicly-traded manufacturing firms.
// DO NOT TUNE — these are the fitted weights from the original discriminant
// analysis. Different company types need a different model (Z', Z''), not
// different coefficients on this one.
const ALTMAN_C1            = 1.2;   // weight on Working Capital / Total Assets
const ALTMAN_C2            = 1.4;   // weight on Retained Earnings / Total Assets
const ALTMAN_C3            = 3.3;   // weight on EBIT / Total Assets
const ALTMAN_C4            = 0.6;   // weight on Market Value Equity / Total Liabilities
const ALTMAN_C5            = 1.0;   // weight on Sales / Total Assets
const ALTMAN_SAFE_ZONE     = 2.99;  // ≥ this → 'Safe' (low bankruptcy risk)
const ALTMAN_DISTRESS_ZONE = 1.81;  // ≤ this → 'Distress' (high bankruptcy risk)
                                    // between the two → 'Grey Zone' (watch carefully)

export interface FinancialRatiosDto {
  period: string;
  liquidity: {
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
    workingCapital: number;
  };
  profitability: {
    grossMarginPct: number;
    netMarginPct: number;
    roa: number;
    roe: number;
    roce: number;
  };
  leverage: {
    debtToEquity: number;
    interestCoverage: number | null;
  };
  altmanZ: {
    score: number;
    zone: 'Safe' | 'Grey Zone' | 'Distress';
    x1: number; x2: number; x3: number; x4: number; x5: number;
  };
  revenue: number;
  cogs: number;
  opex: number;
  netIncome: number;
  totalAssets: number;
  totalEquity: number;
  totalDebt: number;
}

@Injectable()
export class FinancialRatiosService {
  private readonly logger = new Logger(FinancialRatiosService.name);

  constructor(
    private readonly cfoConfig: CfoConfigService,
    @Inject(FINANCE_REPO) private readonly repo: IFinanceRepo,
  ) {}

  @Calculation('financial-ratios-compute')
  async computeForPeriod(period: string): Promise<Result<FinancialRatiosDto, AppError>> {
    try {
      const [marketCap, sharesPrice] = await Promise.all([
        this.cfoConfig.getNumber('shares_outstanding', 1_000_000),
        this.cfoConfig.getNumber('share_price_uzs', 1000),
      ]);

      const g = await this.repo.fetchFinancialRatiosGl(period);
      if (!g) return Err(AppErr('NOT_FOUND', `GL ma'lumotlari topilmadi: ${period}`));

      const {
        revenue, cogs, opex, interestExp: intExp,
        totalAssets, totalEquity, totalDebt,
        currentAssets: ca, currentLiabilities: cl,
        inventory, cash, retainedEarnings: retained,
      } = g;

      const netIncome  = revenue - cogs - opex - intExp;
      const ebit       = revenue - cogs - opex;
      const workingCap = ca - cl;

      const mktCap = marketCap * sharesPrice;
      const x1     = safeDiv(workingCap, totalAssets);
      const x2     = safeDiv(retained, totalAssets);
      const x3     = safeDiv(ebit, totalAssets);
      const x4     = totalDebt > 0 ? safeDiv(mktCap, totalDebt) : 0;
      const x5     = safeDiv(revenue, totalAssets);

      const zScore = ALTMAN_C1 * x1 + ALTMAN_C2 * x2 + ALTMAN_C3 * x3 + ALTMAN_C4 * x4 + ALTMAN_C5 * x5;
      const zone: 'Safe' | 'Grey Zone' | 'Distress' =
        zScore > ALTMAN_SAFE_ZONE ? 'Safe' : zScore < ALTMAN_DISTRESS_ZONE ? 'Distress' : 'Grey Zone';

      const dto: FinancialRatiosDto = {
        period, revenue, cogs, opex, netIncome, totalAssets, totalEquity, totalDebt,
        liquidity: {
          currentRatio:   roundTo(safeDiv(ca, cl), 4),
          quickRatio:     roundTo(safeDiv(ca - inventory, cl), 4),
          cashRatio:      roundTo(safeDiv(cash, cl), 4),
          workingCapital: roundTo(workingCap, 2),
        },
        profitability: {
          grossMarginPct: roundTo(safeDiv(revenue - cogs, revenue) * 100, 2),
          netMarginPct:   roundTo(safeDiv(netIncome, revenue) * 100, 2),
          roa:            roundTo(safeDiv(netIncome, totalAssets) * 100, 2),
          roe:            roundTo(safeDiv(netIncome, totalEquity) * 100, 2),
          roce:           roundTo(safeDiv(ebit, totalAssets - cl) * 100, 2),
        },
        leverage: {
          debtToEquity:     roundTo(safeDiv(totalDebt, totalEquity), 4),
          interestCoverage: intExp > 0 ? roundTo(safeDiv(ebit, intExp), 4) : null,
        },
        altmanZ: {
          score: roundTo(zScore, 4), zone,
          x1: roundTo(x1, 6), x2: roundTo(x2, 6), x3: roundTo(x3, 6),
          x4: roundTo(x4, 6), x5: roundTo(x5, 6),
        },
      };

      await this.repo.saveFinancialRatiosSnapshot({
        period,
        currentRatio:   dto.liquidity.currentRatio,
        quickRatio:     dto.liquidity.quickRatio,
        grossMarginPct: dto.profitability.grossMarginPct,
        netMarginPct:   dto.profitability.netMarginPct,
        roa:            dto.profitability.roa,
        roe:            dto.profitability.roe,
        debtToEquity:   dto.leverage.debtToEquity,
        altmanZ:        dto.altmanZ.score,
        altmanZone:     dto.altmanZ.zone,
        revenue:        dto.revenue,
        netIncome:      dto.netIncome,
      });
      if (zScore < ALTMAN_DISTRESS_ZONE) {
        await this.repo.flagAltmanDistress(period, zScore).catch(
          e => this.logger.warn(`Altman distress flag xato: ${String(e)}`),
        );
        this.logger.error(`AltmanDistress: period=${period} z-score=${zScore.toFixed(4)} — CFO notification yaratildi`);
      }
      return Ok(dto);
    } catch (err) {
      this.logger.error(`FinancialRatiosService.computeForPeriod xato: ${String(err)}`);
      return Err('Ichki server xatosi');
    }
  }
}
