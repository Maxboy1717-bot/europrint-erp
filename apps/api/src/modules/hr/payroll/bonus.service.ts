/**
 * @module bonus.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * Moslashuvchan mukofot (bonus) mexanizmi (master-reja 3.15). Jarima mexanizmi
 * (discipline_records → late-arrival-fine.cron / LateArrivalService) allaqachon
 * AI-avtomatik ravishda ishlaydi; mukofot esa RAHBAR tomonidan qo'lda beriladi
 * (reyting/summa/foiz moslashuvchan — hozircha summa asosida, foiz keyingi
 * bosqichda `bonusPercentage` ustuni orqali kengaytiriladi).
 */

import { Inject, Injectable } from '@nestjs/common';
import { Result, Err, AppErr, AppError } from '@common/result';
import { BonusRepository, type BonusPaymentRow, type BonusStatus } from './bonus.repository';

// 2026-07-13: + 'referral' (Referral Tizimi completion, vizyon 02-hr#12/20/21) —
// system-triggered bonus paid once a referred candidate's probation completes
// (ReferralBonusListener), additive to the existing manager-given types.
const VALID_BONUS_TYPES = ['performance', 'kpi', 'kaizen', 'quality', 'attendance', 'special', 'referral', 'other'] as const;

@Injectable()
export class BonusService {
  constructor(@Inject(BonusRepository) private readonly repo: BonusRepository) {}

  /** Rahbar mukofot taklif qiladi ('pending' holatida) — HR/DIRECTOR keyin tasdiqlaydi. */
  async createBonus(input: {
    employeeId: number;
    bonusType: string;
    amount: number;
    reason: string;
    givenBy: number;
    bonusPeriodStart?: string | null;
    bonusPeriodEnd?: string | null;
  }): Promise<Result<BonusPaymentRow, AppError>> {
    if (!Number.isInteger(input.employeeId) || input.employeeId <= 0) {
      return Err(AppErr('VALIDATION', "Xodim ID noto'g'ri"));
    }
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      return Err(AppErr('VALIDATION', "Mukofot summasi musbat bo'lishi kerak"));
    }
    if (!input.reason || input.reason.trim().length < 5) {
      return Err(AppErr('VALIDATION', "Sabab kamida 5 ta belgi bo'lishi kerak"));
    }
    const bonusType = VALID_BONUS_TYPES.includes(input.bonusType as (typeof VALID_BONUS_TYPES)[number])
      ? input.bonusType
      : 'other';
    return this.repo.create({
      employeeId: input.employeeId,
      bonusType,
      amount: input.amount,
      reason: input.reason.trim(),
      givenBy: input.givenBy,
      bonusPeriodStart: input.bonusPeriodStart ?? null,
      bonusPeriodEnd: input.bonusPeriodEnd ?? null,
    });
  }

  async listByEmployee(employeeId: number): Promise<Result<BonusPaymentRow[], AppError>> {
    return this.repo.listByEmployee(employeeId);
  }

  async list(status?: BonusStatus, limit = 50, offset = 0): Promise<Result<BonusPaymentRow[], AppError>> {
    return this.repo.list(status, limit, offset);
  }

  /** HR/DIRECTOR mukofotni tasdiqlaydi — shundan keyingina payroll'ga qo'shiladi. */
  async approve(id: number, approvedBy: number): Promise<Result<BonusPaymentRow, AppError>> {
    if (!Number.isInteger(id) || id <= 0) return Err(AppErr('VALIDATION', "Mukofot ID noto'g'ri"));
    return this.repo.approve(id, approvedBy);
  }

  async reject(id: number, approvedBy: number): Promise<Result<BonusPaymentRow, AppError>> {
    if (!Number.isInteger(id) || id <= 0) return Err(AppErr('VALIDATION', "Mukofot ID noto'g'ri"));
    return this.repo.reject(id, approvedBy);
  }

  /** PayrollService.generatePeriodRows shu bilan bitta xodimning davr-bonusini oladi. */
  async sumApprovedForPeriod(employeeId: number, from: string, to: string): Promise<Result<number, AppError>> {
    return this.repo.sumApprovedByEmployeeAndPeriod(employeeId, from, to);
  }

  /** Barcha xodimlar uchun davr-bonus xaritasi — generatePeriodRows N+1 siz o'qiydi. */
  async sumApprovedGroupedByEmployee(from: string, to: string): Promise<Result<Map<number, number>, AppError>> {
    return this.repo.sumApprovedGroupedByEmployee(from, to);
  }

  async getById(id: number): Promise<Result<BonusPaymentRow | null, AppError>> {
    return this.repo.getById(id);
  }
}
