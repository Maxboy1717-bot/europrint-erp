import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Inject, Logger} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IHrRecruitmentFunnelRepository, HR_RECRUITMENT_FUNNEL_REPO } from './repos/i-hr-recruitment-funnel.repo';
import type { FunnelStage, ProductivityCategory } from './dto/create-funnel.dto';
import type { CreateFunnelDto, MoveFunnelStageDto, QuickScreeningDto, ListFunnelDto } from './dto/create-funnel.dto';
import { safeCall, Result, AppError } from '@common/result';

/**
 * Event payload emitted after a candidate's funnel stage transitions.
 * The recruitment websocket gateway picks this up and re-broadcasts it
 * over Socket.io so any connected Kanban client invalidates its cache.
 */
export const CANDIDATE_STAGE_CHANGED_EVENT = 'candidate.stage-changed';

export interface CandidateStageChangedPayload {
  funnelId: number;
  candidateId: number | null;
  fromStage: FunnelStage | null;
  toStage: FunnelStage;
  changedById: number;
  notes?: string | null;
  occurredAt: Date;
}

export const VALID_TRANSITIONS: Record<FunnelStage, FunnelStage[]> = {
  NEW:                 ['QUESTIONNAIRE_SENT', 'PHONE_SCREENING', 'REJECTED'],
  QUESTIONNAIRE_SENT:  ['PHONE_SCREENING', 'REJECTED'],
  PHONE_SCREENING:     ['INTERVIEW_SCHEDULED', 'REJECTED'],
  INTERVIEW_SCHEDULED: ['INTERVIEWED', 'REJECTED'],
  INTERVIEWED:         ['TEST_SENT', 'REJECTED'],
  TEST_SENT:           ['TEST_ANALYSIS', 'REJECTED'],
  TEST_ANALYSIS:       ['REFERENCES_CHECK', 'REJECTED'],
  REFERENCES_CHECK:    ['PROBATION', 'OFFER_SENT', 'REJECTED'],
  PROBATION:           ['OFFER_SENT', 'REJECTED'],
  OFFER_SENT:          ['HIRED', 'REJECTED'],
  HIRED:               [],
  REJECTED:            [],
};

@Injectable()
export class RecruitmentFunnelService {
  private readonly logger = new Logger(RecruitmentFunnelService.name);

  constructor(
    @Inject(HR_RECRUITMENT_FUNNEL_REPO) private readonly hrRecruitmentFunnelRepo: IHrRecruitmentFunnelRepository,
    private readonly emitter: EventEmitter2,
  ) {}

  async createFunnel(dto: CreateFunnelDto, createdById: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const candidateResult = await this.hrRecruitmentFunnelRepo.findCandidateById(dto.candidateId);
    if (!candidateResult.ok) throw new InternalServerErrorException(candidateResult.error);
    if (!candidateResult.data) throw new NotFoundException(`Nomzod #${dto.candidateId} topilmadi`);

    const existingResult = await this.hrRecruitmentFunnelRepo.findActiveFunnelForCandidate(dto.candidateId);
    if (!existingResult.ok) throw new InternalServerErrorException(existingResult.error);
    if (existingResult.data) throw new BadRequestException(`Nomzod #${dto.candidateId} allaqachon aktiv funnelda`);

    const funnelResult = await this.hrRecruitmentFunnelRepo.createFunnel(dto, createdById);
    if (!funnelResult.ok) throw new InternalServerErrorException(funnelResult.error);
    const funnel = funnelResult.data;

    await this.hrRecruitmentFunnelRepo.insertFunnelHistory({ funnelId: (funnel as Record<string, unknown>).id as number, fromStage: null, toStage: 'NEW', changedById: createdById, notes: 'Funnel yaratildi' });
    return funnel;
  
    });}

  async listFunnels(query: ListFunnelDto){
    return safeCall(async () => {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const result = await this.hrRecruitmentFunnelRepo.listFunnels({ stage: query.stage, vacancyId: query.vacancyId, recruiterId: query.recruiterId, productivityCategory: query.productivityCategory, page, limit });
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async getFunnelById(id: number){
    return safeCall(async () => {
    const result = await this.hrRecruitmentFunnelRepo.getFunnelById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(`Funnel #${id} topilmadi`);
    return result.data;
  
    });}

  async getFunnelKanban(vacancyId?: number){
    return safeCall(async () => {
    const result = await this.hrRecruitmentFunnelRepo.getFunnelKanban(vacancyId);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const all = result.data;
    const stages: FunnelStage[] = [
      'NEW', 'QUESTIONNAIRE_SENT', 'PHONE_SCREENING', 'INTERVIEW_SCHEDULED',
      'INTERVIEWED', 'TEST_SENT', 'TEST_ANALYSIS', 'REFERENCES_CHECK',
      'PROBATION', 'OFFER_SENT', 'HIRED', 'REJECTED',
    ];
    return (Array.isArray(stages) ? stages : []).map((stage) => ({
      stage,
      candidates: (all as Record<string, unknown>[]).filter((c) => c['funnelStage'] === stage),
      count: (all as Record<string, unknown>[]).filter((c) => c['funnelStage'] === stage).length,
    }));
  
    });}

  async moveFunnelStage(funnelId: number, dto: MoveFunnelStageDto, changedById: number){
    return safeCall(async () => {
    const funnelResult = await this.hrRecruitmentFunnelRepo.getFunnelById(funnelId);
    if (!funnelResult.ok) throw new InternalServerErrorException(funnelResult.error);
    if (!funnelResult.data) throw new NotFoundException(`Funnel #${funnelId} topilmadi`);
    const funnel = funnelResult.data;
    if (!funnel.isActive) throw new BadRequestException('Funnel yopilgan');

    const currentStage = funnel.funnelStage as FunnelStage;
    const allowed = VALID_TRANSITIONS[currentStage] ?? [];
    if (!allowed.includes(dto.newStage)) {
      throw new BadRequestException(
        `${currentStage} bosqichidan ${dto.newStage} bosqichiga o'tish mumkin emas. ` +
        `Ruxsat etilgan: [${allowed.join(', ')}]`,
      );
    }

    if (dto.newStage === 'REFERENCES_CHECK') {
      const countResult = await this.hrRecruitmentFunnelRepo.countReferencesChecks(funnelId);
      if (!countResult.ok) throw new InternalServerErrorException(countResult.error);
      if (countResult.data === 0) {
        throw new BadRequestException('REFERENCES_CHECK bosqichiga o\'tish uchun kamida 1 ta navedenie spravok yozuvi kerak.');
      }
    }

    const updates: Record<string, unknown> = { funnelStage: dto.newStage, updatedAt: _time.now() };
    if (dto.newStage === 'HIRED') updates.hiredAt = _time.now();
    else if (dto.newStage === 'REJECTED') {
      updates.isActive = false;
      updates.rejectedAt = _time.now();
      if (dto.notes) updates.rejectionReason = dto.notes;
    }

    const updateResult = await this.hrRecruitmentFunnelRepo.updateFunnel(funnelId, updates);
    if (!updateResult.ok) throw new InternalServerErrorException(updateResult.error);

    await this.hrRecruitmentFunnelRepo.insertFunnelHistory({ funnelId, fromStage: currentStage, toStage: dto.newStage, changedById, notes: dto.notes });

    // T5.2 — emit websocket event so connected Kanban clients refresh
    // (re-broadcast happens in RecruitmentGateway).
    const updated = updateResult.data as Record<string, unknown> | undefined;
    const candidateId = (updated?.['candidateId'] as number | undefined)
      ?? ((funnel as Record<string, unknown>)['candidateId'] as number | undefined)
      ?? null;
    const payload: CandidateStageChangedPayload = {
      funnelId,
      candidateId,
      fromStage: currentStage,
      toStage: dto.newStage,
      changedById,
      notes: dto.notes ?? null,
      occurredAt: _time.now(),
    };
    this.emitter.emit(CANDIDATE_STAGE_CHANGED_EVENT, payload);

    return updateResult.data;

    });}

  async quickScreening(funnelId: number, dto: QuickScreeningDto, userId: number){
    return safeCall(async () => {
    const funnelResult = await this.hrRecruitmentFunnelRepo.getFunnelById(funnelId);
    if (!funnelResult.ok) throw new InternalServerErrorException(funnelResult.error);
    if (!funnelResult.data) throw new NotFoundException(`Funnel #${funnelId} topilmadi`);
    const funnel = funnelResult.data;

    const updates: Record<string, unknown> = { screeningScore: dto.screeningScore, initialScreeningNotes: dto.notes, updatedAt: _time.now() };
    if (dto.isQuickRejected) {
      updates.isQuickRejected = true;
      updates.quickRejectionReason = dto.quickRejectionReason;
      updates.funnelStage = 'REJECTED';
      updates.isActive = false;
      updates.rejectedAt = _time.now();
    }

    const updateResult = await this.hrRecruitmentFunnelRepo.updateFunnel(funnelId, updates);
    if (!updateResult.ok) throw new InternalServerErrorException(updateResult.error);

    if (dto.isQuickRejected) {
      await this.hrRecruitmentFunnelRepo.insertFunnelHistory({
        funnelId, fromStage: funnel.funnelStage as FunnelStage, toStage: 'REJECTED', changedById: userId,
        notes: `Tez rad: ${dto.quickRejectionReason ?? 'Ko\'rsatilmagan'}`,
      });
    }
    return updateResult.data;
  
    });}
}
