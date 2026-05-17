import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
/**
 * Onboarding Service — HR CAPITAL "Путь сотрудника" (Session 5)
 * 6 haftalik standart onboarding + Job Descriptions + Motivatsiya
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { IHrOnboardingRepository, HR_ONBOARDING_REPO } from './repos/i-hr-onboarding.repo';
import { OnboardingJobService } from './onboarding-job.service';
import { OnboardingProgressService, type OnboardingRecord } from './onboarding-progress.service';
import type {
  CreateOnboardingPlanDto,
  StartEmployeeOnboardingDto,
  UpdateOnboardingProgressDto,
  CompleteProbationDto,
  CreateJobDescriptionDto,
} from './dto/onboarding.dto';
import { safeCall, Result, AppError } from '@common/result';

// HR CAPITAL: 6 haftalik standart onboarding (HR Manager uchun namuna)
export const DEFAULT_HR_MANAGER_ONBOARDING: CreateOnboardingPlanDto['weeklyPlan'] = [
  {
    week: 1,
    title: 'Asoslar: Kurs + Bozor tadqiqoti',
    goals: ['HR CAPITAL kursi 1-sessiya o\'rganish', 'Kompaniya ichki qoidalari'],
    tasks: [
      { day: 1, title: 'HR CAPITAL 1-sessiya', type: 'COURSE', durationHours: 4, isRequired: true },
      { day: 2, title: 'Kompaniya tuzilmasi + RBAC tushunish', type: 'SHADOWING', durationHours: 3, isRequired: true },
      { day: 3, title: 'HR CAPITAL 2-sessiya', type: 'COURSE', durationHours: 4, isRequired: true },
      { day: 4, title: 'hh.uz bozor tadqiqoti — 5 ta raqobatchi vakansiya', type: 'TASK', isRequired: true },
      { day: 5, title: 'HR bo\'limi jarayonlari bilan tanishish', type: 'SHADOWING', durationHours: 4, isRequired: true },
    ],
    weeklyCheckpoint: 'HR CAPITAL 1-2 sessiyalar imtihoni (80%+ ball)',
  },
  {
    week: 2,
    title: 'Amaliy bilim: Kurs davomi',
    goals: ['HR CAPITAL 3-4 sessiya', 'Tool Test o\'rganish'],
    tasks: [
      { day: 1, title: 'HR CAPITAL 3-sessiya (HR tekshiruvi)', type: 'COURSE', durationHours: 4, isRequired: true },
      { day: 2, title: 'Tool Test A-J o\'rganish + amaliyot', type: 'TASK', durationHours: 3, isRequired: true },
      { day: 3, title: 'HR CAPITAL 4-sessiya', type: 'COURSE', durationHours: 4, isRequired: true },
      { day: 4, title: 'Mavjud kandidatlar bilan Tool Test o\'tkazish (nazorat ostida)', type: 'TASK', isRequired: true },
      { day: 5, title: 'Hafta yakunlash + rahbar bilan 1:1', type: 'MEETING', durationHours: 1, isRequired: true },
    ],
    weeklyCheckpoint: 'Kamida 3 ta kandidat bilan Tool Test o\'tkazildi',
  },
  {
    week: 3,
    title: 'Yakunlash: 5-sessiya + Mustaqil ish boshlash',
    goals: ['HR CAPITAL 5-sessiya', 'Birinchi mustaqil vakansiya'],
    tasks: [
      { day: 1, title: 'HR CAPITAL 5-sessiya (Lavozim tavsifi)', type: 'COURSE', durationHours: 4, isRequired: true },
      { day: 2, title: 'Birinchi mustaqil vakansiya e\'loni (nazorat ostida)', type: 'TASK', isRequired: true },
      { day: 3, title: 'Onboarding reja tuzish (bitta lavozim uchun)', type: 'TASK', durationHours: 3, isRequired: true },
      { day: 4, title: 'HR CAPITAL kursi yakuniy testi', type: 'TEST', isRequired: true },
      { day: 5, title: '3 hafta yakunlash + 60-kun maqsadlar belgilash', type: 'MEETING', isRequired: true },
    ],
    weeklyCheckpoint: 'HR CAPITAL kursi 80%+ ball bilan yakunlandi',
  },
  {
    week: 4,
    title: 'Faol rekruting: Vakansiya e\'lonlari',
    goals: ['Kamida 2 ta vakansiya faollashtirildi', '20+ nomzod jalb qilindi'],
    tasks: [
      { day: 1, title: 'hh.uz, OLX.uz vakansiyalar joylashtirish', type: 'TASK', isRequired: true },
      { day: 2, title: 'Telegram kanallar + Instagram rekruting', type: 'TASK', isRequired: true },
      { day: 3, title: 'Nomzodlar oqimini kuzatish + Kanban boshqaruv', type: 'TASK', isRequired: true },
      { day: 4, title: 'Tez suhbatlar (Screening calls)', type: 'TASK', durationHours: 4, isRequired: true },
      { day: 5, title: 'Haftalik statistika hisoboti', type: 'TASK', isRequired: true },
    ],
    weeklyCheckpoint: '≥ 20 yangi nomzod, ≥ 10 tez suhbat',
  },
  {
    week: 5,
    title: 'Intervyular: Produktivlik baholash',
    goals: ['Produktivlik intervyulari o\'tkazish', 'Flagman nomzodlarni aniqlash'],
    tasks: [
      { day: 1, title: 'Kuniga ≥ 3 ta produktivlik intervyu', type: 'TASK', durationHours: 5, isRequired: true },
      { day: 2, title: 'Tool Test + natijalarni solishtirish', type: 'TASK', isRequired: true },
      { day: 3, title: 'Navedenie spravok (Reference check)', type: 'TASK', isRequired: true },
      { day: 4, title: 'Taklif yuborish (top nomzodlar)', type: 'TASK', isRequired: true },
      { day: 5, title: 'Haftalik statistika + KPI ball hisoblash', type: 'TASK', isRequired: true },
    ],
    weeklyCheckpoint: '≥ 2 ta Flagman nomzod aniqlandi',
  },
  {
    week: 6,
    title: 'Yakunlash: Probation baholash',
    goals: ['6 hafta yakunlash', 'Mustaqil ishlashga tayyor'],
    tasks: [
      { day: 1, title: 'Birinchi yollangan xodim onboarding boshlash', type: 'TASK', isRequired: true },
      { day: 2, title: 'Barcha jarayonlar hujjatlashtirish', type: 'TASK', isRequired: true },
      { day: 3, title: 'Keyingi 3 oy uchun rekruting reja tuzish', type: 'TASK', isRequired: true },
      { day: 4, title: 'Rahbar bilan 90-kun KPI muhokamasi', type: 'MEETING', durationHours: 2, isRequired: true },
      { day: 5, title: 'Probation yakuniy bahosi', type: 'TEST', isRequired: true },
    ],
    weeklyCheckpoint: 'Probation muvaffaqiyatli yakunlandi (≥ 70 ball)',
  },
];

@Injectable()
export class OnboardingService {
  constructor(
    private readonly jobSvc: OnboardingJobService,
    @Inject(HR_ONBOARDING_REPO) private readonly hrOnboardingRepo: IHrOnboardingRepository,
    private readonly progressSvc: OnboardingProgressService,
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

    const result = await this.hrOnboardingRepo.startOnboarding({ employeeId: dto.employeeId, planId: dto.planId, mentorId: dto.mentorId, startDate, expectedEndDate });
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
      const today = new Date().toISOString().split('T')[0]!;
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
