import { hrOnboardingPlans, hrEmployeeOnboardings } from '@europrint/schemas';
import { Result } from '@common/result';

type OnboardingPlanRow = typeof hrOnboardingPlans.$inferSelect;
type EmployeeOnboardingRow = typeof hrEmployeeOnboardings.$inferSelect;

export interface IHrOnboardingRepository {
  createPlan(dto: unknown, createdById: number): Promise<Result<OnboardingPlanRow>>;
  listPlans(positionId?: number, departmentId?: number): Promise<Result<OnboardingPlanRow[]>>;
  getPlanById(id: number): Promise<Result<OnboardingPlanRow | null>>;
  findEmployeeById(employeeId: number): Promise<Result<{ id: number; fullName: string | null } | null>>;
  startOnboarding(dto: { employeeId: number; planId: number; mentorId?: number; startDate: Date; expectedEndDate: Date }): Promise<Result<EmployeeOnboardingRow>>;
  getOnboardingById(id: number): Promise<Result<EmployeeOnboardingRow | null>>;
  updateProgress(id: number, weeklyProgress: unknown[], updatedAt: Date): Promise<Result<EmployeeOnboardingRow>>;
  completeProbation(id: number, dto: { status: string; probationScore?: number; probationNotes?: string; isProbationPassed: boolean; actualEndDate: Date; updatedAt: Date }): Promise<Result<EmployeeOnboardingRow>>;
  getEmployeeOnboarding(employeeId: number): Promise<Result<EmployeeOnboardingRow[]>>;
}

export const HR_ONBOARDING_REPO = 'IHrOnboardingRepository';
