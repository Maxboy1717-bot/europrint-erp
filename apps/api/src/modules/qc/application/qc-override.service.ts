/**
 * @module qc-override.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Err, Ok, isOk, Result } from '@common/result';
import { QcOverrideRepository } from '../infrastructure/repositories/qc-override.repository';

// Vision 09-qc#35: kunlik 3 / oylik 15 override cheklovi — vizyon bergan raqamlar (egasi-data emas).
export const QC_OVERRIDE_DAILY_LIMIT = 3;
export const QC_OVERRIDE_MONTHLY_LIMIT = 15;

export interface OverrideOutcome {
  override: Record<string, unknown>;
  dailyUsed: number;
  monthlyUsed: number;
  dailyLimit: number;
  monthlyLimit: number;
  escalated: boolean;
}

@Injectable()
export class QcOverrideService {
  constructor(private readonly repo: QcOverrideRepository) {}

  /** Record a QC inspection-skip override; flag escalation to director when the 3/day or 15/month allowance is exceeded. */
  async recordOverride(input: { userId: number; inspectionId?: number | null; reason: string }): Promise<Result<OverrideOutcome>> {
    const reason = (input.reason ?? '').trim();
    if (!reason) return Err({ code: 'VALIDATION' as const, message: 'Override sababi majburiy' });
    if (!Number.isFinite(input.userId) || input.userId <= 0) {
      return Err({ code: 'VALIDATION' as const, message: 'Foydalanuvchi aniqlanmadi' });
    }

    const countR = await this.repo.countRecent(input.userId);
    if (!isOk(countR)) return Err(countR.error);
    const { daily, monthly } = countR.data;

    // This override is #(daily+1) today / #(monthly+1) this month. Escalate when it exceeds either allowance.
    const dailyUsed = daily + 1;
    const monthlyUsed = monthly + 1;
    const escalated = dailyUsed > QC_OVERRIDE_DAILY_LIMIT || monthlyUsed > QC_OVERRIDE_MONTHLY_LIMIT;

    const insertR = await this.repo.insert({
      userId: input.userId,
      inspectionId: input.inspectionId ?? null,
      reason,
      escalated,
    });
    if (!isOk(insertR)) return Err(insertR.error);

    return Ok({
      override: insertR.data,
      dailyUsed,
      monthlyUsed,
      dailyLimit: QC_OVERRIDE_DAILY_LIMIT,
      monthlyLimit: QC_OVERRIDE_MONTHLY_LIMIT,
      escalated,
    });
  }

  listOverrides(limit: number, offset: number): Promise<Result<object[]>> {
    return this.repo.findRecent(limit, offset);
  }
}
