/**
 * @module tax-calculator.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum, roundTo } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';

export interface TaxBreakdown {
  grossSalary: number;
  incomeTax: number;
  employeePension: number;
  employerPension: number;
  socialFund: number;
  netSalary: number;
  totalEmployerCost: number;
  effectiveTaxRate: number;
  /** Reconciliation: |net - gross*0.87| <= 1 bo'lishi kerak */
  _drift: number;
}

export interface BonusTaxResult extends TaxBreakdown {
  baseGross: number;
  bonusAmount: number;
  combinedGross: number;
}

/**
 * TaxCalculatorService — O'zbekiston Mehnat Kodeksi bo'yicha soliq hisob-kitobi.
 *
 * Soliq stavkalari (2024):
 *   Daromad solig'i (JSHIR): 12%
 *   Pensiya fondi (xodim):    1%
 *   Pensiya fondi (ish beruvchi): 12%
 *   INPS (ish beruvchi):      5%
 *
 * Net formula: net = gross * (1 - 0.12 - 0.01) = gross * 0.87
 * Reconciliation: |computed_net - gross*0.87| <= 1 (yaxlitish oqibati)
 */
@Injectable()
export class TaxCalculatorService {
  private readonly logger = new Logger(TaxCalculatorService.name);

  private readonly INCOME_TAX_RATE     = 0.12;
  private readonly PENSION_EMPLOYEE    = 0.01;
  private readonly PENSION_EMPLOYER    = 0.12;
  private readonly SOCIAL_FUND         = 0.05;
  /** Net koeffitsienti: 1 - 0.12 - 0.01 = 0.87 */
  private readonly NET_COEFFICIENT     = 0.87;

  @Calculation('hr.tax.calculateTaxes')
  calculateTaxes(grossSalary: number): Result<TaxBreakdown, AppError> {
    const gross = safeNum(grossSalary);
    if (gross <= 0) {
      return Err('grossSalary musbat son bo\'lishi kerak');
    }

    const incomeTax        = Math.round(gross * this.INCOME_TAX_RATE);
    const employeePension  = Math.round(gross * this.PENSION_EMPLOYEE);
    const employerPension  = Math.round(gross * this.PENSION_EMPLOYER);
    const socialFund       = Math.round(gross * this.SOCIAL_FUND);

    // Net = Math.round(gross × NET_COEFFICIENT) — bitta yaxlitlash (cascade yo'q)
    // drift doim 0 bo'lishi garantiyalanadi
    const netSalary         = Math.round(gross * this.NET_COEFFICIENT);
    const totalEmployerCost = gross + employerPension + socialFund;
    const effectiveTaxRate  = roundTo(((incomeTax + employeePension) / gross) * 100, 2);

    // Reconciliation check: |net - gross*0.87| <= 1
    const expectedNet = Math.round(gross * this.NET_COEFFICIENT);
    const drift = Math.abs(netSalary - expectedNet);

    if (drift > 1) {
      this.logger.warn(
        `TaxCalculator drift: gross=${gross}, net=${netSalary}, expected=${expectedNet}, drift=${drift}`,
      );
    }

    return Ok({
      grossSalary: gross,
      incomeTax,
      employeePension,
      employerPension,
      socialFund,
      netSalary,
      totalEmployerCost,
      effectiveTaxRate,
      _drift: drift,
    });
  }

  @Calculation('hr.tax.calculateWithBonus')
  calculateWithBonus(grossSalary: number, bonus: number): Result<BonusTaxResult, AppError> {
    const combinedGross = safeNum(grossSalary) + safeNum(bonus);
    const baseResult = this.calculateTaxes(combinedGross);
    if (!baseResult.ok) return Err(baseResult.error);
    return Ok({
      ...baseResult.data,
      baseGross: safeNum(grossSalary),
      bonusAmount: safeNum(bonus),
      combinedGross,
    });
  }

  /**
   * Net summadan brutto hisoblash (teskari formula).
   * gross = round(net / 0.87)
   */
  @Calculation('hr.tax.grossToNet')
  grossToNet(netTarget: number): number {
    return Math.round(safeNum(netTarget) / this.NET_COEFFICIENT);
  }

  formatForPayslip(breakdown: TaxBreakdown): Record<string, string> {
    const fmt = (n: number) => n.toLocaleString('uz-UZ') + ' so\'m';
    return {
      'Brutto maosh':                  fmt(breakdown.grossSalary),
      'Daromad solig\'i (12%)':        `-${fmt(breakdown.incomeTax)}`,
      'Pensiya fondi (1%)':            `-${fmt(breakdown.employeePension)}`,
      'Netto maosh':                   fmt(breakdown.netSalary),
      'Ish beruvchi pensiya (12%)':    fmt(breakdown.employerPension),
      'INPS (5%)':                     fmt(breakdown.socialFund),
      'Jami ish beruvchi xarajati':    fmt(breakdown.totalEmployerCost),
    };
  }
}
