/**
 * @module referral-bonus.listener
 * @description Referral Tizimi completion (2026-07-13, vizyon docs/vision/_parts/
 * 02-hr.md #12/#20/#21 + E6 fairness principle).
 *
 * Listens for `HR_PROBATION_COMPLETED_EVENT` (emitted by the REAL, wired
 * `OnboardingService.completeProbation()` — see onboarding.events.ts for why this
 * is the one real signal, not a duplicate mechanism). If the employee whose
 * probation just passed was hired through an employee referral (`hr_referrals`,
 * matched via `hired_employee_id` — set by HR via `PATCH /hr/referrals/:id`),
 * pays the referral bonus as a REAL payroll line item:
 *   1. Amount from `business_settings.hr.referral_bonus_amount` (never hardcoded).
 *   2. Inserted into `bonus_payments` via the existing BonusRepository (same
 *      table `PayrollService.generatePeriodRows` already sums into payroll —
 *      no second/parallel payroll mechanism), auto-approved (SYSTEM_USER_ID)
 *      because this is a system-verified entitlement, not manager discretion.
 *   3. `hr_referrals.status` -> 'bonus_paid' (a real value in the live
 *      hr_referrals_status_check CHECK constraint).
 *
 * Paid to `referrer_id` regardless of the referrer's current employment status —
 * per vision, the bonus was earned and is owed even if the referring employee
 * has since left the company (E6 fairness).
 *
 * Failures are caught + logged, never thrown back onto the event bus — a bonus
 * hiccup must not break the probation-completion flow it is reacting to.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { getBusinessSettingNumber } from '../../../shared/config/business-settings.reader';
import { SYSTEM_USER_ID } from '@common/constants/app.constants';
import { BonusRepository } from './bonus.repository';
import { HR_PROBATION_COMPLETED_EVENT, type ProbationCompletedPayload } from '../onboarding/onboarding.events';

const REFERRAL_BONUS_SETTING_KEY = 'hr.referral_bonus_amount';
const REFERRAL_BONUS_DEFAULT = 500_000; // so'm — CRUD-editable via business_settings, never hardcoded in logic

interface HiredReferralRow {
  id: number;
  referrer_id: number;
}

@Injectable()
export class ReferralBonusListener {
  private readonly logger = new Logger(ReferralBonusListener.name);

  constructor(private readonly bonusRepo: BonusRepository) {}

  @OnEvent(HR_PROBATION_COMPLETED_EVENT)
  async onProbationCompleted(payload: ProbationCompletedPayload): Promise<void> {
    try {
      if (!payload?.employeeId) return;

      const rows = await typedExecute<HiredReferralRow>(sql`
        SELECT id, referrer_id FROM hr_referrals
        WHERE hired_employee_id = ${payload.employeeId}
          AND status = 'hired'
          AND bonus_paid = false
        LIMIT 1
      `);
      const referral = Array.isArray(rows) ? rows[0] : undefined;
      if (!referral) return; // this hire was not a referral (or bonus already handled) — nothing to do

      const bonusAmount = await getBusinessSettingNumber(REFERRAL_BONUS_SETTING_KEY, REFERRAL_BONUS_DEFAULT);
      if (!(bonusAmount > 0)) {
        this.logger.warn(`Referral #${referral.id}: bonus_amount <= 0 (setting '${REFERRAL_BONUS_SETTING_KEY}') — skipped`);
        return;
      }

      const created = await this.bonusRepo.create({
        employeeId: referral.referrer_id,
        bonusType: 'referral',
        amount: bonusAmount,
        reason: `Xodim tavsiyasi bonusi — tavsiya qilingan nomzod (xodim #${payload.employeeId}) probatsiyani muvaffaqiyatli tugatdi`,
        givenBy: SYSTEM_USER_ID,
      });
      if (!created.ok) {
        this.logger.error(`Referral #${referral.id}: bonus_payments insert failed — ${created.error.message}`);
        return;
      }

      // System-verified entitlement (probation completion is an objective fact,
      // not manager discretion) — auto-approve so PayrollService.generatePeriodRows
      // picks it up on the next period without a manual HR approval step.
      const approved = await this.bonusRepo.approve(created.data.id, SYSTEM_USER_ID);
      if (!approved.ok) {
        this.logger.warn(`Referral #${referral.id}: bonus_payments #${created.data.id} created but auto-approve failed — ${approved.error.message}`);
      }

      await typedExecute(sql`
        UPDATE hr_referrals
        SET status = 'bonus_paid', bonus_type = 'referral', bonus_amount = ${bonusAmount}, bonus_paid = true, updated_at = NOW()
        WHERE id = ${referral.id}
      `);

      this.logger.log(`Referral #${referral.id}: bonus ${bonusAmount} so'm paid to employee #${referral.referrer_id} (probation of employee #${payload.employeeId} completed)`);
    } catch (e) {
      this.logger.error(`ReferralBonusListener failed for employeeId=${payload?.employeeId}: ${String(e)}`);
    }
  }
}
