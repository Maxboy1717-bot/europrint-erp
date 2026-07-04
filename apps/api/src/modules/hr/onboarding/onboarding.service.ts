/**
 * @module onboarding.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
/**
 * Onboarding Service — HR CAPITAL "Путь сотрудника" (Session 5)
 * 6 haftalik standart onboarding + Job Descriptions + Motivatsiya
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { IHrOnboardingRepository, HR_ONBOARDING_REPO } from './repos/i-hr-onboarding.repo';
import { OnboardingJobService } from './onboarding-job.service';
import { OnboardingProgressService, type OnboardingRecord } from './onboarding-progress.service';
import { CardService } from '../../org-structure/card.service';
import type {
  CreateOnboardingPlanDto,
  StartEmployeeOnboardingDto,
  UpdateOnboardingProgressDto,
  CompleteProbationDto,
  CreateJobDescriptionDto,
} from './dto/onboarding.dto';
import { safeCall, Result, AppError } from '@common/result';
import { DEFAULT_HR_MANAGER_ONBOARDING } from './onboarding-defaults';

// Re-export so any external consumer importing from `onboarding.service` keeps working.
// Per Rule 16 (≤ 300 lines): the 80-line default plan now lives in `onboarding-defaults.ts`.
export { DEFAULT_HR_MANAGER_ONBOARDING };

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly jobSvc: OnboardingJobService,
    @Inject(HR_ONBOARDING_REPO) private readonly hrOnboardingRepo: IHrOnboardingRepository,
    private readonly progressSvc: OnboardingProgressService,
    // SB0072/SB0101: probation-pass activates the onboarding target card (employee_cards).
    private readonly cardService: CardService,
  ) {}

  // ───────────────────── ONBOARDING PLANS ─────────────────────────────────

  async createPlan(dto: CreateOnboardingPlanDto, createdById: number){
    const result = await this.hrOnboardingRepo.createPlan(dto, createdById);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  }

  async createDefaultHrManagerPlan(createdById: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    return this.createPlan(
      {
        name: 'HR Manager standart onboarding — 6 hafta',
        nameRu: 'HR менеджер стандартный онбординг — 6 недель',
        probationDays: 90,
        weeklyPlan: DEFAULT_HR_MANAGER_ONBOARDING,
        successCriteria: [
          { name: 'HR CAPITAL kursi', target: '≥ 80% ball', evaluationDate: '21-kun' },
          { name: 'Yollangan nomzodlar', target: '≥ 1 ta Flagman', evaluationDate: '42-kun' },
          { name: 'Haftalik KPI score', target: '≥ 70/100', evaluationDate: '42-kun' },
          { name: 'Mustaqil rekruting', target: '≥ 2 ta faol vakansiya', evaluationDate: '90-kun' },
        ],
      },
      createdById,
    );
  
    });}

  async listPlans(positionId?: number, departmentId?: number){
    return safeCall(async () => {
    const result = await this.hrOnboardingRepo.listPlans(positionId, departmentId);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async getPlanById(id: number) {
    const result = await this.hrOnboardingRepo.getPlanById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Onboarding plan #${id} topilmadi`);
    return result.data;
  }

  // ─────────────────── EMPLOYEE ONBOARDINGS ───────────────────────────────

  async startOnboarding(dto: StartEmployeeOnboardingDto, startedById: number){
    return safeCall(async () => {
    const empResult = await this.hrOnboardingRepo.findEmployeeById(dto.employeeId);
    if (!empResult.ok) throw new InternalServerErrorException(empResult.error);
    if (!empResult.data) throw new NotFoundException(`Xodim #${dto.employeeId} topilmadi`);

    const plan = await this.getPlanById(dto.planId);

    const startDate = new Date(dto.startDate);
    const expectedEndDate = new Date(startDate);
    expectedEndDate.setDate(expectedEndDate.getDate() + (plan.durationDays ?? 90));

    const result = await this.hrOnboardingRepo.startOnboarding({
      employeeId: dto.employeeId,
      planId: dto.planId,
      mentorId: dto.mentorId,
      startDate,
      expectedEndDate,
      // SB0072/SB0101: onboarding nishon-kartasi — completeProbation shu kartani faollashtiradi.
      cardId: dto.cardId,
    });
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;

    });}

  async updateProgress(onboardingId: number, dto: UpdateOnboardingProgressDto, evaluatedById: number){
    return safeCall(async () => {
    const onboardingResult = await this.hrOnboardingRepo.getOnboardingById(onboardingId);
    if (!onboardingResult.ok) throw new InternalServerErrorException(onboardingResult.error);
    if (!onboardingResult.data) throw new NotFoundException(`Onboarding #${onboardingId} topilmadi`);

    const onboarding = onboardingResult.data;
    const currentProgress = (onboarding.weeklyProgress ?? []) as Record<string, unknown>[];
    const existingWeekIdx = (currentProgress as Record<string, unknown>[]).findIndex((p) => p['week'] === dto.week);
    const weekEntry = {
      week: dto.week,
      completedTasks: dto.completedTasks,
      totalTasks: dto.totalTasks,
      checkpointPassed: dto.checkpointPassed,
      notes: dto.notes,
      evaluatedAt: _time.now().toISOString(),
      evaluatedById,
    };

    if (existingWeekIdx >= 0) {
      currentProgress[existingWeekIdx] = weekEntry;
    } else {
      currentProgress.push(weekEntry);
    }

    const result = await this.hrOnboardingRepo.updateProgress(onboardingId, currentProgress, _time.now());
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  /**
   * SB0072/SB0101 fix — onboarding→karta uzilishi: probatsiya 'PASSED' bo'lsa va onboarding
   * yozuvida nishon-karta (`card_id`) belgilangan bo'lsa, xodim shu kartaga CardService orqali
   * biriktiriladi (employee_cards INSERT, EP-ORG-002 atomic guard bilan). FABRIKATSIYA YO'Q
   * (Q-40): card_id NULL bo'lsa (eski yozuv yoki hali belgilanmagan) — hech narsa faollashtirilmaydi,
   * faqat probatsiya natijasi yoziladi (avvalgi xulq o'zgarmaydi). Karta band bo'lsa (409 CONFLICT)
   * yoki topilmasa (404) — probatsiya natijasi baribir saqlanadi (karta-faollashtirish ikkinchi
   * darajali qadam, probatsiya bahosini bloklamaydi), xato faqat loglanadi.
   */
  async completeProbation(onboardingId: number, dto: CompleteProbationDto){
    return safeCall(async () => {
    const onboardingResult = await this.hrOnboardingRepo.getOnboardingById(onboardingId);
    if (!onboardingResult.ok) throw new InternalServerErrorException(onboardingResult.error);
    if (!onboardingResult.data) throw new NotFoundException(`Onboarding #${onboardingId} topilmadi`);

    const result = await this.hrOnboardingRepo.completeProbation(onboardingId, {
      status: dto.isProbationPassed ? 'COMPLETED' : 'FAILED',
      probationScore: dto.probationScore,
      probationNotes: dto.probationNotes,
      isProbationPassed: dto.isProbationPassed,
      actualEndDate: _time.now(),
      updatedAt: _time.now(),
    });
    if (!result.ok) throw new InternalServerErrorException(result.error);

    if (dto.isProbationPassed) {
      const onboarding = onboardingResult.data as Record<string, unknown>;
      // Onboarding.employeeId is a users.id (findEmployeeById queries `users`), but
      // employee_cards.employee_id FKs to employees(id) — bridge via employees.user_id
      // (findEmployeesIdByUserId) before calling CardService (Q-40: no id fabricated/guessed).
      const userId = Number(onboarding['employeeId'] ?? onboarding['employee_id'] ?? 0);
      const cardId = onboarding['cardId'] ?? onboarding['card_id'];
      if (userId > 0 && cardId != null && Number(cardId) > 0) {
        const empIdR = await this.hrOnboardingRepo.findEmployeesIdByUserId(userId);
        if (!empIdR.ok || !empIdR.data) {
          this.logger.warn(
            `completeProbation #${onboardingId}: karta #${cardId} faollashtirilmadi — xodim (employees) userId=#${userId} uchun topilmadi`,
          );
        } else {
          const assignR = await this.cardService.assignEmployeeToCard(Number(cardId), empIdR.data, true);
          if (!assignR.ok) {
            this.logger.warn(
              `completeProbation #${onboardingId}: karta #${cardId} faollashtirilmadi (xodim #${empIdR.data}) — ${assignR.error.message}`,
            );
          }
        }
      }
    }

    return result.data;

    });}

  async getEmployeeOnboarding(employeeId: number){
    return safeCall(async () => {
    const result = await this.hrOnboardingRepo.getEmployeeOnboarding(employeeId);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  // ──────────────────── JOB DESCRIPTIONS ──────────────────────────────────

  createJobDescription(dto: CreateJobDescriptionDto, createdById: number) { return this.jobSvc.createJobDescription(dto, createdById); }
  listJobDescriptions(positionId?: number) { return this.jobSvc.listJobDescriptions(positionId); }
  approveJobDescription(id: number, approvedById: number) { return this.jobSvc.approveJobDescription(id, approvedById); }

  // ──────────────────── MOTIVATION PLANS ──────────────────────────────────

  createMotivationPlan(employeeId: number, data: { toneScaleLevel?: number; toneScaleDescription?: string; orientationType?: string; orientationNotes?: string; motivationFactors?: Record<string, unknown>; actionPlan?: unknown[] }, createdById: number) { return this.jobSvc.createMotivationPlan(employeeId, data, createdById); }
  getEmployeeMotivationPlan(employeeId: number) { return this.jobSvc.getEmployeeMotivationPlan(employeeId); }

  // ──────────────────── BUDDY ASSIGNMENT ──────────────────────────────────

  async assignBuddy(onboardingId: number, buddyId: number) {
    return safeCall(async () => {
      const onboardingResult = await this.hrOnboardingRepo.getOnboardingById(onboardingId);
      if (!onboardingResult.ok) throw new InternalServerErrorException(onboardingResult.error);
      if (!onboardingResult.data) throw new NotFoundException(`Onboarding #${onboardingId} topilmadi`);

      const employeeId = Number((onboardingResult.data as Record<string, unknown>)['employeeId'] ?? (onboardingResult.data as Record<string, unknown>)['employee_id'] ?? 0);
      const check = this.progressSvc.validateBuddyAssignment(employeeId, buddyId);
      if (!check.ok) throw new BadRequestException(check.error.message);

      const buddyExists = await this.hrOnboardingRepo.findEmployeeById(buddyId);
      if (!buddyExists.ok) throw new InternalServerErrorException(buddyExists.error);
      if (!buddyExists.data) throw new NotFoundException(`Buddy xodim #${buddyId} topilmadi`);

      const updated = await this.hrOnboardingRepo.assignBuddy(onboardingId, buddyId);
      if (!updated.ok) throw new InternalServerErrorException(updated.error);
      return updated.data;
    });
  }

  // ──────────────────── DASHBOARD STATS ───────────────────────────────────

  async getDashboardStats() {
    return safeCall(async () => {
      const all = await this.hrOnboardingRepo.listAllOnboardings();
      if (!all.ok) throw new InternalServerErrorException(all.error);
      const today = new Date().toISOString().substring(0, 10);
      const rows = Array.isArray(all.data) ? all.data : [];
      const records: OnboardingRecord[] = rows.map((r) => {
        const rec = r as Record<string, unknown>;
        let weekly: unknown = rec['weeklyProgress'] ?? rec['weekly_progress'];
        if (typeof weekly === 'string') {
          try { weekly = JSON.parse(weekly); } catch { weekly = []; }
        }
        return {
          id: Number(rec['id'] ?? 0),
          employeeId: Number(rec['employeeId'] ?? rec['employee_id'] ?? 0),
          status: String(rec['status'] ?? ''),
          startDate: rec['startDate'] ? new Date(rec['startDate'] as string | Date).toISOString().split('T')[0] : undefined,
          expectedEndDate: rec['expectedEndDate'] ? new Date(rec['expectedEndDate'] as string | Date).toISOString().split('T')[0] : undefined,
          weeklyProgress: Array.isArray(weekly) ? (weekly as Record<string, unknown>[]).map((w) => ({
            week: Number((w as Record<string, unknown>)['week'] ?? 0),
            completedTasks: Number((w as Record<string, unknown>)['completedTasks'] ?? 0),
            totalTasks: Number((w as Record<string, unknown>)['totalTasks'] ?? 0),
            checkpointPassed: (w as Record<string, unknown>)['checkpointPassed'] as boolean | undefined,
          })) : [],
        };
      });
      return this.progressSvc.computeDashboardStats(records, today);
    });
  }
}
