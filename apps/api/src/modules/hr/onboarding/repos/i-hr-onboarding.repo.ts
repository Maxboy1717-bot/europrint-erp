/**
 * @module i-hr-onboarding.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { hrOnboardingPlans, hrEmployeeOnboardings } from '@europrint/schemas';
import { Result } from '@common/result';

type OnboardingPlanRow = typeof hrOnboardingPlans.$inferSelect;
type EmployeeOnboardingRow = typeof hrEmployeeOnboardings.$inferSelect;

/** One onboarding_tasks template row (position/card-scoped master data — id + title only). */
export interface OnboardingDocTaskRow {
  id: number;
  title: string;
}

export interface IHrOnboardingRepository {
  createPlan(dto: unknown, createdById: number): Promise<Result<OnboardingPlanRow>>;
  listPlans(positionId?: number, departmentId?: number): Promise<Result<OnboardingPlanRow[]>>;
  getPlanById(id: number): Promise<Result<OnboardingPlanRow | null>>;
  findEmployeeById(employeeId: number): Promise<Result<{ id: number; fullName: string | null } | null>>;
  /**
   * SB0072/SB0101: onboarding's `employeeId` is a `users.id` (findEmployeeById queries `users`),
   * but `employee_cards.employee_id` FKs to `employees(id)` — a DIFFERENT id space bridged by
   * `employees.user_id`. Resolves users.id → employees.id so completeProbation can call
   * CardService.assignEmployeeToCard with the correct id. Returns null when the user has no
   * employees row (e.g. a system/admin account with no HR profile) — FABRIKATSIYA YO'Q.
   */
  findEmployeesIdByUserId(userId: number): Promise<Result<number | null>>;
  /**
   * 2026-07-13 onboarding→karta wiring: the REVERSE bridge (employees.id → users.id) — needed
   * because `CARD_EMPLOYEE_ASSIGNED_EVENT.employeeId` is `employees.id` (org-structure id-space)
   * but `hr_employee_onboardings.employee_id` is a `users.id` (see above). Returns null (not
   * fabricated) when `employees.user_id` is unset — callers MUST degrade gracefully (log + skip).
   */
  findUserIdByEmployeeId(employeeId: number): Promise<Result<number | null>>;
  /**
   * 2026-07-13: resolve the CARD's own onboarding plan (org_department_id = cardId, active,
   * newest wins). Card-centric per vision (plan derives from the CARD, not the employee).
   * Returns null (not fabricated) when the owner hasn't bound a plan to this card yet.
   */
  findActivePlanByCard(cardId: number): Promise<Result<OnboardingPlanRow | null>>;
  startOnboarding(dto: { employeeId: number; planId: number; mentorId?: number; startDate: Date; expectedEndDate: Date; cardId?: number }): Promise<Result<EmployeeOnboardingRow>>;
  getOnboardingById(id: number): Promise<Result<EmployeeOnboardingRow | null>>;
  updateProgress(id: number, weeklyProgress: unknown[], updatedAt: Date): Promise<Result<EmployeeOnboardingRow>>;
  completeProbation(id: number, dto: { status: string; probationScore?: number; probationNotes?: string; isProbationPassed: boolean; actualEndDate: Date; updatedAt: Date }): Promise<Result<EmployeeOnboardingRow>>;
  getEmployeeOnboarding(employeeId: number): Promise<Result<EmployeeOnboardingRow[]>>;
  assignBuddy(onboardingId: number, buddyId: number): Promise<Result<EmployeeOnboardingRow>>;
  listAllOnboardings(): Promise<Result<EmployeeOnboardingRow[]>>;

  // ─── Onboarding-task template materialization (2026-07-13, `onboarding_tasks`/`user_onboarding_progress`) ───

  /**
   * All active (non-deleted) onboarding_tasks template rows bound to a card, for materializing
   * a new hire's per-task tracking rows. `cardId` is an `org_departments.id` (the canonical
   * karta table). `onboarding_tasks.org_function_id` FK was fixed 2026-08-04 (P0 discovery
   * sweep) to reference `org_departments(id)` instead of the retired `org_functions(id)` — see
   * migrations-drift.ts "onboarding_tasks.org_function_id FK -> org_departments" and the
   * doc-comment in drizzle-hr-onboarding.repo.ts. Still honestly returns [] when the owner
   * hasn't bound any task templates to the card (no fabrication, Q-40) — that is real absence
   * of data, not the FK/id-space bug.
   */
  findTemplateTasksForCard(cardId: number): Promise<Result<OnboardingDocTaskRow[]>>;
  /** Idempotent: creates a `user_onboarding_progress` row (completed=false) unless one already exists. */
  ensureTaskProgress(userId: number, taskId: number): Promise<Result<{ created: boolean }>>;
  /**
   * Required ('document' type, is_required=true) onboarding_tasks bound to a card — the set the
   * Payroll document-complete gate must verify. Same `cardId` = `org_departments.id` semantics
   * as findTemplateTasksForCard above (FK fixed 2026-08-04).
   */
  findRequiredDocumentTasksByCard(cardId: number): Promise<Result<OnboardingDocTaskRow[]>>;
  /** Which of the given task ids are marked `completed=true` in user_onboarding_progress for this user. */
  findCompletedTaskIds(userId: number, taskIds: number[]): Promise<Result<Set<number>>>;
}

export const HR_ONBOARDING_REPO = 'IHrOnboardingRepository';
