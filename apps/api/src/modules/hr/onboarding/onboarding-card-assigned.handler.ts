/**
 * @module onboarding-card-assigned.handler
 * @description 2026-07-13 HR-ORG audit fix (docs/audit/HR-ORG-VIZYON-VA-CHALA-ISHLAR-2026-07-13.md
 *   §4.1 "Onboarding → karta faollash → Payroll zanjiri UZUQ"): `hr_onboarding_plans`/
 *   `hr_onboarding_milestones` mechanism was real, but nothing ever called `startOnboarding()` —
 *   `hr_employee_onboardings`/`onboarding_tasks` stayed at 0 rows forever. Root cause was TWO
 *   separate gaps: (1) no listener ever fired on card assignment, AND (2) `hr_onboarding_plans`
 *   had no reachable card-binding field even for a human to set manually (`createPlan` never
 *   read/wrote `org_department_id` — fixed in `drizzle-hr-onboarding.repo.ts` alongside this file).
 *
 * WIRING (mirrors the LMS `CardEmployeeAssignedHandler` pattern exactly, T10-06/A72): org-side
 *   `CardService.assignEmployeeToCard` (org-structure/card.service.ts) emits
 *   `CARD_EMPLOYEE_ASSIGNED_EVENT` (EventEmitter2, app-global `EventEmitterModule.forRoot()`)
 *   AFTER the `employee_cards` INSERT commits. This listener reacts by:
 *     1. resolving the CARD's own onboarding plan (card-centric per vision — the plan derives
 *        from the karta, not the employee: `findActivePlanByCard`),
 *     2. bridging `employees.id` (the event's id-space) → `users.id` (hr_employee_onboardings'
 *        id-space, per the pre-existing SB0072/SB0101 comment in onboarding.service.ts),
 *     3. creating a real `hr_employee_onboardings` row (idempotent — skips if one already
 *        exists for this card+user),
 *     4. materializing the card's `onboarding_tasks` template into per-employee
 *        `user_onboarding_progress` rows (idempotent).
 *
 * FABRIKATSIYA TAQIQ (Q-40): every "nothing to do" branch below is a real absence of owner
 *   data (no plan bound to the card, no `employees.user_id` link, no task template) — never a
 *   fabricated plan/id/task. NEVER THROWS: any failure is logged and swallowed so a broken
 *   onboarding write can never roll back the (already committed) card assignment.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  CARD_EMPLOYEE_ASSIGNED_EVENT,
  type CardEmployeeAssignedPayload,
} from '../../lms/infrastructure/event-handlers/card-employee-assigned.handler';
import { HR_ONBOARDING_REPO, type IHrOnboardingRepository } from './repos/i-hr-onboarding.repo';

@Injectable()
export class OnboardingCardAssignedHandler {
  private readonly logger = new Logger(OnboardingCardAssignedHandler.name);

  constructor(@Inject(HR_ONBOARDING_REPO) private readonly repo: IHrOnboardingRepository) {}

  /** EventEmitter2 entrypoint — wraps {@link handle} so a failure never propagates. */
  @OnEvent(CARD_EMPLOYEE_ASSIGNED_EVENT)
  async onCardEmployeeAssigned(payload: CardEmployeeAssignedPayload): Promise<void> {
    try {
      await this.handle(payload);
    } catch (error: unknown) {
      this.logger.error(
        { payload, err: error instanceof Error ? error.message : String(error) },
        'Onboarding avto-boshlash FAILED — karta biriktirilishi allaqachon commit qilingan, faqat onboarding yozuvi yaratilmadi',
      );
    }
  }

  async handle(payload: CardEmployeeAssignedPayload): Promise<void> {
    const employeeId = Number(payload?.employeeId);
    const cardId = Number(payload?.cardId);
    if (!Number.isInteger(employeeId) || employeeId <= 0 || !Number.isInteger(cardId) || cardId <= 0) {
      this.logger.warn({ payload }, 'Onboarding avto-boshlash: invalid payload (employeeId/cardId) — skipped');
      return;
    }

    const planR = await this.repo.findActivePlanByCard(cardId);
    if (!planR.ok) {
      this.logger.error({ cardId, err: planR.error }, "Onboarding avto-boshlash: karta rejasini o'qib bo'lmadi");
      return;
    }
    const plan = planR.data as Record<string, unknown> | null;
    if (!plan) {
      // Q-40: owner hasn't bound an onboarding plan to this card yet — no fabricated plan.
      this.logger.log({ cardId, employeeId }, "Onboarding avto-boshlash: kartaga biriktirilgan faol reja yo'q — skipped (owner data)");
      return;
    }

    const userIdR = await this.repo.findUserIdByEmployeeId(employeeId);
    if (!userIdR.ok || !userIdR.data) {
      this.logger.warn(
        { cardId, employeeId },
        "Onboarding avto-boshlash: xodim (employees) uchun users bog'lanishi (user_id) topilmadi — onboarding yozilmadi (owner-data gap)",
      );
      return;
    }
    const userId = userIdR.data;

    // Idempotency: re-assignment / event redelivery must not create a duplicate onboarding
    // for the SAME card+user (no unique DB constraint exists yet — app-level check-then-insert).
    const existingR = await this.repo.getEmployeeOnboarding(userId);
    if (existingR.ok && Array.isArray(existingR.data)) {
      const dup = existingR.data.some((o) => {
        const row = o as Record<string, unknown>;
        return Number(row['cardId'] ?? row['card_id']) === cardId;
      });
      if (dup) {
        this.logger.log({ cardId, userId }, 'Onboarding avto-boshlash: bu karta uchun onboarding allaqachon mavjud — skipped (idempotent)');
        return;
      }
    }

    const planId = Number(plan['id']);
    const probationDays = Number(plan['probationDays'] ?? plan['durationDays'] ?? 90);
    const startDate = new Date();
    const expectedEndDate = new Date(startDate);
    expectedEndDate.setDate(expectedEndDate.getDate() + (Number.isFinite(probationDays) && probationDays > 0 ? probationDays : 90));

    const startR = await this.repo.startOnboarding({ employeeId: userId, planId, startDate, expectedEndDate, cardId });
    if (!startR.ok) {
      this.logger.error({ cardId, userId, planId, err: startR.error }, 'Onboarding avto-boshlash: hr_employee_onboardings yozilmadi');
      return;
    }
    const created = startR.data as Record<string, unknown>;
    this.logger.log(
      { cardId, userId, planId, onboardingId: created['id'] },
      'Onboarding avto-boshlash: hr_employee_onboardings yaratildi (karta-reja bilan)',
    );

    await this.materializeTasks(cardId, userId);
  }

  /**
   * Materialize the card's `onboarding_tasks` TEMPLATE into per-employee
   * `user_onboarding_progress` rows (idempotent — `ensureTaskProgress` no-ops on repeat).
   * Q-40: a card with no bound tasks is a real no-op, NOT a fabricated checklist —
   * `onboarding_tasks.org_function_id` FK was fixed 2026-08-04 to target the canonical
   * `org_departments(id)` (was the STALE `org_functions` table, see migrations-drift.ts); the
   * remaining no-op case is simply "owner hasn't bound a task template to this card yet"
   * (real owner-data gap, no further code change needed).
   */
  private async materializeTasks(cardId: number, userId: number): Promise<void> {
    const tasksR = await this.repo.findTemplateTasksForCard(cardId);
    if (!tasksR.ok) {
      this.logger.warn({ cardId, err: tasksR.error }, "Onboarding avto-boshlash: karta vazifa-shablonini o'qib bo'lmadi");
      return;
    }
    const tasks = tasksR.data;
    if (tasks.length === 0) {
      this.logger.log({ cardId, userId }, "Onboarding avto-boshlash: kartaga biriktirilgan onboarding_tasks yo'q — skipped (owner data)");
      return;
    }

    let createdCount = 0;
    let already = 0;
    for (const t of tasks) {
      const r = await this.repo.ensureTaskProgress(userId, t.id);
      if (!r.ok) {
        this.logger.warn({ userId, taskId: t.id, err: r.error }, 'Onboarding avto-boshlash: bitta vazifa progress-yozuvi yaratilmadi');
        continue;
      }
      if (r.data.created) createdCount += 1;
      else already += 1;
    }
    this.logger.log(
      { cardId, userId, total: tasks.length, created: createdCount, already },
      'Onboarding avto-boshlash: vazifa-shablon user_onboarding_progress ga yozildi',
    );
  }
}
