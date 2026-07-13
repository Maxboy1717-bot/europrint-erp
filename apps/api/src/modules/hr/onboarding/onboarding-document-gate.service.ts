/**
 * @module onboarding-document-gate.service
 * @description 2026-07-13 HR-ORG audit fix (§4.1/§3.1): "30-kunlik sinov muddati — majburiy
 *   hujjatlar to'liq bo'lguncha Payroll blok, hujjat to'liq bo'lganda avto-ochiladi." Mirrors
 *   `LmsCardGateService` (EP-ORG-027) byte-for-byte in structure: a DB-side wrapper that
 *   resolves the card's required 'document' `onboarding_tasks`, checks each is
 *   `completed=true` in `user_onboarding_progress` for the card's occupant, and returns one
 *   card-level verdict Payroll can gate on (`computeGatedMonthlySalary`).
 *
 * Fabrication ban (Q-40): when NO required document task is bound to the card
 * (`onboarding_tasks.org_function_id` currently 0 live rows — see repo doc-comment, this FK
 * still targets the STALE pre-migration `org_functions` table, not the canonical
 * `org_departments`) the verdict is `allComplete=true` with an empty incomplete list —
 * "no document bound = no block". This is the correct, honest open state, NOT a fabricated
 * pass. The moment the owner reconciles the card-link column and binds required documents,
 * the gate starts blocking until they are genuinely completed.
 *
 * FAIL-CLOSED: a required document exists but the employees→users bridge is missing
 * (`employees.user_id` NULL — currently the case for every row, DB was reset 2026-07-11) is
 * treated as INCOMPLETE (cannot verify completion ⇒ not complete), never as a silent pass.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { HR_ONBOARDING_REPO, type IHrOnboardingRepository, type OnboardingDocTaskRow } from './repos/i-hr-onboarding.repo';

export interface OnboardingDocsGateResult {
  cardId: number;
  employeeId: number;
  /** false => oylik-gate CLOSED for this card until required onboarding documents complete. */
  allComplete: boolean;
  /** number of required 'document' onboarding_tasks bound to the card (0 => open by default). */
  totalRequired: number;
  /** onboarding_tasks.id of every unfinished required document. */
  incompleteTaskIds: number[];
  /** human-readable failing reasons (Uzbek), empty when complete. */
  reasons: string[];
}

@Injectable()
export class OnboardingDocumentGateService {
  private readonly logger = new Logger(OnboardingDocumentGateService.name);

  constructor(@Inject(HR_ONBOARDING_REPO) private readonly repo: IHrOnboardingRepository) {}

  /**
   * Is this card's occupant's mandatory onboarding paperwork complete?
   *
   * @param cardId     org_departments.id (the canonical karta)
   * @param employeeId employees.id of the person holding the card
   */
  async isCardOnboardingDocsComplete(cardId: number, employeeId: number): Promise<Result<OnboardingDocsGateResult>> {
    if (!Number.isInteger(cardId) || cardId <= 0) {
      return Err(AppErr('VALIDATION', `cardId noto'g'ri (musbat butun son bo'lishi kerak): ${cardId}`));
    }
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return Err(AppErr('VALIDATION', `employeeId noto'g'ri (musbat butun son bo'lishi kerak): ${employeeId}`));
    }

    const tasksR = await this.repo.findRequiredDocumentTasksByCard(cardId);
    if (!tasksR.ok) return Err(tasksR.error);
    const tasks = tasksR.data;

    // No required document bound to this card => nothing to block (honest open, not fabricated).
    if (tasks.length === 0) {
      return Ok({ cardId, employeeId, allComplete: true, totalRequired: 0, incompleteTaskIds: [], reasons: [] });
    }

    const userIdR = await this.repo.findUserIdByEmployeeId(employeeId);
    if (!userIdR.ok || !userIdR.data) {
      // Required docs exist but we cannot resolve WHO to check completion for — fail-closed.
      this.logger.warn(
        `docs-gate: emp #${employeeId} uchun user_id topilmadi (employees.user_id bo'sh) — fail-closed (karta #${cardId})`,
      );
      return Ok({
        cardId,
        employeeId,
        allComplete: false,
        totalRequired: tasks.length,
        incompleteTaskIds: tasks.map((t) => t.id),
        reasons: [`Xodim #${employeeId} uchun login (users) bog'lanishi topilmadi — hujjat holati tekshirib bo'linmadi (fail-closed)`],
      });
    }

    const completedR = await this.repo.findCompletedTaskIds(userIdR.data, tasks.map((t) => t.id));
    if (!completedR.ok) {
      this.logger.warn(`docs-gate: emp #${employeeId} (user #${userIdR.data}) vazifa-holatini o'qib bo'lmadi — fail-closed: ${completedR.error.message}`);
      return Ok({
        cardId,
        employeeId,
        allComplete: false,
        totalRequired: tasks.length,
        incompleteTaskIds: tasks.map((t) => t.id),
        reasons: [`Hujjat-holati o'qib bo'lmadi (fail-closed): ${completedR.error.message}`],
      });
    }

    const incomplete: OnboardingDocTaskRow[] = tasks.filter((t) => !completedR.data.has(t.id));
    return Ok({
      cardId,
      employeeId,
      allComplete: incomplete.length === 0,
      totalRequired: tasks.length,
      incompleteTaskIds: incomplete.map((t) => t.id),
      reasons: incomplete.map((t) => `Majburiy hujjat "${t.title}" hali yuklanmagan/tasdiqlanmagan`),
    });
  }

  /** Convenience boolean for consumers that only need the open/closed decision. Fails CLOSED on error. */
  async isCardOnboardingDocsCompleteBool(cardId: number, employeeId: number): Promise<boolean> {
    const r = await this.isCardOnboardingDocsComplete(cardId, employeeId);
    return r.ok ? r.data.allComplete : false;
  }
}
