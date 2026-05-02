/**
 * overtime-calculator.service.ts — TZ-46: Konfiguratsiyalanadigan OT Kalkulyator
 *
 * MUHIM: Qoidalar overtime_policy jadvalidan o'qiladi — hardcoded emas.
 * Hech qanday O'zbek qonunchiligi kodi yo'q.
 *
 * DB oqimi:
 *   1. overtime_policy jadvalidan faol siyosat olinadi (isActive=true, eng oxirgi effectiveFrom)
 *   2. Base_Rate = grossMonthly / workingHoursPerMonth
 *   3. OT_Pay = Σ_segment OT_h × Base_Rate × Multiplier_segment
 *
 * DB invariantlar (overtime_policy jadvalida CHECK sifatida):
 *   regular_multiplier   >= 1.0
 *   extended_multiplier  >= regular_multiplier
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';
import { safeNum, safeDiv } from '@common/math/math-utils';
import { Calculation } from '@common/decorators/calculation.decorator';
import { runQuery } from '@shared/db';
import { db } from '@shared/db';
import { overtime_policy } from '@shared/db/schema-hr-overtime';
import { eq, desc } from 'drizzle-orm';

export interface OvertimePolicy {
  regularOvertimeHours: number;
  regularMultiplier: number;
  extendedMultiplier: number;
  weekendMultiplier: number;
  nightShiftBonus: number;
  nightShiftStartHour: number;
  nightShiftEndHour: number;
}

export interface OtTimeEntry {
  date: string;
  otHours: number;
  startHour?: number;
  endHour?: number;
  isWeekend?: boolean;
}

export interface OtCalculationInput {
  grossMonthly: number;
  workingHoursPerMonth: number;
  timeEntries: OtTimeEntry[];
}

export interface OtPayResult {
  baseRate: number;
  regularOtHours: number;
  extendedOtHours: number;
  weekendOtHours: number;
  nightBonusHours: number;
  regularOtPay: number;
  extendedOtPay: number;
  weekendOtPay: number;
  nightBonusPay: number;
  totalOtPay: number;
  policySnapshot: OvertimePolicy;
}

@Injectable()
export class OvertimeCalculatorService {
  private calcNightHours(entry: OtTimeEntry, policy: OvertimePolicy): number {
    const startHour = safeNum(entry.startHour ?? 0);
    const otHours = safeNum(entry.otHours);
    const ns = policy.nightShiftStartHour;
    const ne = policy.nightShiftEndHour;

    let nightHours = 0;
    for (let h = startHour; h < startHour + otHours; h++) {
      const hour = h % 24;
      const isNight = ns > ne
        ? (hour >= ns || hour < ne)
        : (hour >= ns && hour < ne);
      if (isNight) nightHours++;
    }
    return Math.min(nightHours, otHours);
  }

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  /**
   * DB dan faol siyosat olinadi.
   * isActive=true va eng katta effectiveFrom qiymatiga ega qator qaytariladi.
   */
  @Calculation('hr.overtime.loadPolicy')
  async loadActivePolicy(): Promise<Result<OvertimePolicy, AppError>> {
    const rows = await runQuery(
      db
        .select()
        .from(overtime_policy)
        .where(eq(overtime_policy.isActive, true))
        .orderBy(desc(overtime_policy.effectiveFrom))
        .limit(1),
    );

    if (!rows.length) {
      return Err({ code: 'NOT_FOUND', message: 'Faol overtime_policy siyosati topilmadi' });
    }

    const row = rows[0];
    return Ok({
      regularOvertimeHours: safeNum(row.regularOvertimeHours),
      regularMultiplier:    safeNum(row.regularMultiplier),
      extendedMultiplier:   safeNum(row.extendedMultiplier),
      weekendMultiplier:    safeNum(row.weekendMultiplier),
      nightShiftBonus:      safeNum(row.nightShiftBonus),
      nightShiftStartHour:  safeNum(row.nightShiftStartHour),
      nightShiftEndHour:    safeNum(row.nightShiftEndHour),
    });
  }

  /**
   * Asosiy hisoblash metodi.
   * overtime_policy jadvalidan faol siyosatni o'qib, OT to'lovini hisoblaydi.
   */
  @Calculation('hr.overtime.calculate')
  async calculateOtPay(input: OtCalculationInput): Promise<Result<OtPayResult, AppError>> {
    const policyResult = await this.loadActivePolicy();
    if (!policyResult.ok) return Err(policyResult.error);
    return this.computeWithPolicy(input, policyResult.data);
  }

  /**
   * Sof hisoblash (siyosat tashqaridan beriladi).
   * Test va audit uchun, yoki siyosatni avval yuklab bo'lganda ishlatiladi.
   */
  @Calculation('hr.overtime.computeWithPolicy')
  async computeWithPolicy(
    input: OtCalculationInput,
    policy: OvertimePolicy,
  ): Promise<Result<OtPayResult, AppError>> {
    const { grossMonthly, workingHoursPerMonth, timeEntries } = input;

    const gross = safeNum(grossMonthly);
    const wh = safeNum(workingHoursPerMonth);

    if (gross <= 0) {
      return Err({ code: 'BAD_REQUEST', message: 'grossMonthly musbat bo\'lishi kerak' });
    }
    if (wh <= 0) {
      return Err({ code: 'BAD_REQUEST', message: 'workingHoursPerMonth musbat bo\'lishi kerak' });
    }

    const regMult = safeNum(policy.regularMultiplier);
    const extMult = safeNum(policy.extendedMultiplier);
    const wkMult  = safeNum(policy.weekendMultiplier);
    const nBonus  = safeNum(policy.nightShiftBonus);

    if (regMult < 1.0) {
      return Err({ code: 'BAD_REQUEST', message: 'regularMultiplier ≥ 1.0 bo\'lishi kerak (overtime_policy DB qoidasi)' });
    }
    if (extMult < regMult) {
      return Err({ code: 'BAD_REQUEST', message: 'extendedMultiplier ≥ regularMultiplier bo\'lishi kerak (overtime_policy DB qoidasi)' });
    }

    const baseRate = safeDiv(gross, wh);
    const regOtLimit = safeNum(policy.regularOvertimeHours);

    let regularOtHours = 0;
    let extendedOtHours = 0;
    let weekendOtHours = 0;
    let nightBonusHours = 0;

    for (const entry of timeEntries) {
      const ot = safeNum(entry.otHours);
      if (ot <= 0) continue;

      if (entry.isWeekend) {
        weekendOtHours += ot;
      } else {
        regularOtHours  += Math.min(ot, regOtLimit);
        extendedOtHours += Math.max(0, ot - regOtLimit);
      }
      nightBonusHours += this.calcNightHours(entry, policy);
    }

    const regularOtPay  = this.round2(regularOtHours  * baseRate * regMult);
    const extendedOtPay = this.round2(extendedOtHours * baseRate * extMult);
    const weekendOtPay  = this.round2(weekendOtHours  * baseRate * wkMult);
    const nightBonusPay = this.round2(nightBonusHours * baseRate * nBonus);
    const totalOtPay    = this.round2(regularOtPay + extendedOtPay + weekendOtPay + nightBonusPay);

    return Ok({
      baseRate: this.round2(baseRate),
      regularOtHours,
      extendedOtHours,
      weekendOtHours,
      nightBonusHours,
      regularOtPay,
      extendedOtPay,
      weekendOtPay,
      nightBonusPay,
      totalOtPay,
      policySnapshot: { ...policy },
    });
  }

  @Calculation('hr.overtime.baseRate')
  async computeBaseRate(
    grossMonthly: number,
    workingHoursPerMonth: number,
  ): Promise<Result<number, AppError>> {
    if (safeNum(grossMonthly) <= 0) {
      return Err({ code: 'BAD_REQUEST', message: 'grossMonthly musbat bo\'lishi kerak' });
    }
    if (safeNum(workingHoursPerMonth) <= 0) {
      return Err({ code: 'BAD_REQUEST', message: 'workingHoursPerMonth musbat bo\'lishi kerak' });
    }
    return Ok(this.round2(safeDiv(grossMonthly, workingHoursPerMonth)));
  }
}
