/**
 * @module i-hr-onboarding.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { hrOnboardingPlans, hrEmployeeOnboardings } from '@europrint/schemas';
import { Result } from '@common/result';

type OnboardingPlanRow = typeof hrOnboardingPlans.$inferSelect;
type EmployeeOnboardingRow = typeof hrEmployeeOnboardings.$inferSelect;

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
  startOnboarding(dto: { employeeId: number; planId: number; mentorId?: number; startDate: Date; expectedEndDate: Date; cardId?: number }): Promise<Result<EmployeeOnboardingRow>>;
  getOnboardingById(id: number): Promise<Result<EmployeeOnboardingRow | null>>;
  updateProgress(id: number, weeklyProgress: unknown[], updatedAt: Date): Promise<Result<EmployeeOnboardingRow>>;
  completeProbation(id: number, dto: { status: string; probationScore?: number; probationNotes?: string; isProbationPassed: boolean; actualEndDate: Date; updatedAt: Date }): Promise<Result<EmployeeOnboardingRow>>;
  getEmployeeOnboarding(employeeId: number): Promise<Result<EmployeeOnboardingRow[]>>;
  assignBuddy(onboardingId: number, buddyId: number): Promise<Result<EmployeeOnboardingRow>>;
  listAllOnboardings(): Promise<Result<EmployeeOnboardingRow[]>>;
}

export const HR_ONBOARDING_REPO = 'IHrOnboardingRepository';
