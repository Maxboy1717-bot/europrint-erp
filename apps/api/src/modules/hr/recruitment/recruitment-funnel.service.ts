import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Inject, Logger} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IHrRecruitmentFunnelRepository, HR_RECRUITMENT_FUNNEL_REPO } from './repos/i-hr-recruitment-funnel.repo';
import type { FunnelStage, ProductivityCategory } from './dto/create-funnel.dto';
import type { CreateFunnelDto, MoveFunnelStageDto, QuickScreeningDto, ListFunnelDto } from './dto/create-funnel.dto';
import { safeCall, Result, AppError } from '@common/result';
import { Funnel } from '../domain/aggregates/funnel.aggregate';
import { FunnelStage as FunnelStageVO, HC_FUNNEL_STAGES, mapLegacyToHcStage, type HcFunnelStageValue } from '../domain/value-objects/funnel-stage.vo';
import { DomainEvent } from '@shared/domain/domain-event';

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

/**
 * @deprecated The canonical state-machine graph now lives on
 * `Funnel.VALID_TRANSITIONS` (H.9 — funnel was promoted to an aggregate).
 * This re-export preserves the public symbol for back-compat. New code
 * should call `Funnel.moveStage` (etc.) and never inspect this map.
 */
export const VALID_TRANSITIONS: Record<FunnelStage, FunnelStage[]> =
  Funnel.VALID_TRANSITIONS as Record<FunnelStage, FunnelStage[]>;

@Injectable()
export class RecruitmentFunnelService {
  private readonly logger = new Logger(RecruitmentFunnelService.name);

  constructor(
    @Inject(HR_RECRUITMENT_FUNNEL_REPO) private readonly hrRecruitmentFunnelRepo: IHrRecruitmentFunnelRepository,
    private readonly emitter: EventEmitter2,
    private readonly i18n: I18nService,
  ) {}

  async createFunnel(dto: CreateFunnelDto, createdById: number): Promise<Result<object, AppError>> {
    // TODO H.9-FOLLOW-UP: hydrate `Funnel.create(...)` here and persist via
    // the repo. Currently the repo handles the "start at NEW" defaulting,
    // so the aggregate is not on the write path of this method yet.
    return safeCall(async () => {
    const candidateResult = await this.hrRecruitmentFunnelRepo.findCandidateById(dto.candidateId);
    if (!candidateResult.ok) throw new InternalServerErrorException(candidateResult.error);
    if (!candidateResult.data) throw new NotFoundException(await this.i18n.t('errors.candidateNotFoundWithId', { args: { id: dto.candidateId } }));

    const existingResult = await this.hrRecruitmentFunnelRepo.findActiveFunnelForCandidate(dto.candidateId);
    if (!existingResult.ok) throw new InternalServerErrorException(existingResult.error);
    if (existingResult.data) throw new BadRequestException(await this.i18n.t('errors.candidateAlreadyInActiveFunnel', { args: { id: dto.candidateId } }));

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
    if (!result.data) throw new NotFoundException(await this.i18n.t('errors.funnelNotFoundWithId', { args: { id } }));
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

  /**
   * EP-HR-016 — the owner's 7-stage Human-Capital kanban view. Same live data as
   * `getFunnelKanban` (no separate query, no data migration) but the candidates
   * are PROJECTED onto the owner's 7 HC stages (PORTRET → KUCHAYTIRISH) via
   * `mapLegacyToHcStage`. The legacy 12-column board is left untouched (Q-39),
   * so this is an additive view the FE can adopt for the vision's 7-column board.
   * Terminal/inactive candidates (HIRED / REJECTED / unknown legacy codes) map to
   * no HC column, so they are surfaced in a separate `unmapped` group rather than
   * silently dropped.
   */
  async getFunnelKanbanHc(vacancyId?: number){
    return safeCall(async () => {
    const result = await this.hrRecruitmentFunnelRepo.getFunnelKanban(vacancyId);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const all = Array.isArray(result.data) ? (result.data as Record<string, unknown>[]) : [];
    const stages = (HC_FUNNEL_STAGES as readonly HcFunnelStageValue[]).map((hc) => {
      const candidates = all.filter((c) => mapLegacyToHcStage(String(c['funnelStage'] ?? '')) === hc);
      return { stage: hc, candidates, count: candidates.length };
    });
    const unmappedCandidates = all.filter((c) => mapLegacyToHcStage(String(c['funnelStage'] ?? '')) === null);
    return { model: 'hc-7', stages, unmapped: { candidates: unmappedCandidates, count: unmappedCandidates.length } };

    });}

  async moveFunnelStage(funnelId: number, dto: MoveFunnelStageDto, changedById: number){
    return safeCall(async () => {
    const funnelResult = await this.hrRecruitmentFunnelRepo.getFunnelById(funnelId);
    if (!funnelResult.ok) throw new InternalServerErrorException(funnelResult.error);
    if (!funnelResult.data) throw new NotFoundException(await this.i18n.t('errors.funnelNotFoundWithId', { args: { id: funnelId } }));
    const funnel = funnelResult.data;
    if (!funnel.isActive) throw new BadRequestException(await this.i18n.t('errors.funnelClosed'));

    const currentStage = funnel.funnelStage as FunnelStage;

    // H.9 — promote validation to the Funnel aggregate. The aggregate owns
    // both the state-machine graph and the typed domain events. Service
    // still handles persistence and the legacy `candidate.stage-changed`
    // websocket event (so existing Kanban clients keep working).
    const funnelRow = funnel as Record<string, unknown>;
    const aggregateR = Funnel.fromProps({
      id: (funnelRow['id'] as number | undefined) ?? funnelId,
      candidateId: (funnelRow['candidateId'] as number | undefined) ?? 0,
      vacancyId: (funnelRow['vacancyId'] as number | undefined) ?? 0,
      currentStage: currentStage,
      rejectionReason: (funnelRow['rejectionReason'] as string | null | undefined) ?? null,
      hiredEmployeeId: null,
      createdAt: (funnelRow['createdAt'] as Date | undefined) ?? _time.now(),
      updatedAt: (funnelRow['updatedAt'] as Date | undefined) ?? _time.now(),
    });
    if (!aggregateR.ok) throw new BadRequestException(aggregateR.error.message);
    const aggregate = aggregateR.data;

    // REFERENCES_CHECK is a service-level guard (needs a DB count), so it
    // stays here in front of the aggregate transition.
    if (dto.newStage === 'REFERENCES_CHECK') {
      const countResult = await this.hrRecruitmentFunnelRepo.countReferencesChecks(funnelId);
      if (!countResult.ok) throw new InternalServerErrorException(countResult.error);
      if (countResult.data === 0) {
        throw new BadRequestException(await this.i18n.t('errors.referencesRequired'));
      }
    }

    // Drive the aggregate. Terminal transitions use the dedicated method so
    // the right typed event (CandidateRejected / CandidateHired) is buffered.
    let transitionR: Result<void, AppError>;
    if (dto.newStage === 'REJECTED') {
      transitionR = aggregate.reject(dto.notes ?? 'Sabab ko\'rsatilmagan');
    } else if (dto.newStage === 'HIRED') {
      // H.9-FOLLOW-UP: the service does not yet know the employeeId here —
      // hire is currently driven by `moveFunnelStage(HIRED)` which doesn't
      // carry an employee row. Use the candidate's id as a placeholder so
      // the aggregate transition succeeds; the real Employee link is
      // created by the OnboardingService consumer of `CandidateHiredEvent`.
      // Replace with a dedicated `hireCandidate(funnelId, employeeId)` API.
      const placeholderEmployeeId = (funnelRow['candidateId'] as number | undefined) ?? funnelId;
      transitionR = aggregate.hire(placeholderEmployeeId);
    } else {
      const stageR = FunnelStageVO.create(dto.newStage);
      if (!stageR.ok) throw new BadRequestException(stageR.error.message);
      transitionR = aggregate.moveStage(stageR.data);
    }
    if (!transitionR.ok) {
      throw new BadRequestException(transitionR.error.message);
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

    // H.9 — drain typed domain events from the aggregate. They are buffered
    // and ready to be forwarded onto `EventEmitter2` channels such as
    // `recruitment.funnel.candidatemovedfunnelstage`, but doing so here
    // would change the public event surface (the existing
    // `candidate.stage-changed` consumers expect exactly one emit per
    // transition). The drain itself stays so the buffer never grows
    // unbounded — wiring the typed re-emit is tracked below.
    //
    // TODO H.9-FOLLOW-UP: subscribe RecruitmentGateway (and any new
    // domain-event handlers) to the typed channels and remove this
    // discard-only drain.
    this.drainAggregateEvents(aggregate);

    return updateResult.data;

    });}

  /**
   * Drain typed domain events off the Funnel aggregate so the in-memory
   * buffer stays bounded. Currently the events are discarded — the legacy
   * `candidate.stage-changed` emit above is still the single source of
   * truth for downstream consumers. See `TODO H.9-FOLLOW-UP` in
   * `moveFunnelStage` for the planned wiring to typed channels.
   */
  private drainAggregateEvents(aggregate: Funnel): void {
    const events: DomainEvent[] = aggregate.getDomainEvents();
    // Reserved for the typed re-emit path; suppress unused-locals lint
    // until the follow-up wiring lands.
    void events;
    aggregate.clearDomainEvents();
  }

  async quickScreening(funnelId: number, dto: QuickScreeningDto, userId: number){
    // TODO H.9-FOLLOW-UP: when `isQuickRejected` is true this method does a
    // REJECTED transition without going through `Funnel.reject(...)`. Move
    // that branch onto the aggregate so `CandidateRejectedEvent` is emitted
    // for quick rejections too.
    return safeCall(async () => {
    const funnelResult = await this.hrRecruitmentFunnelRepo.getFunnelById(funnelId);
    if (!funnelResult.ok) throw new InternalServerErrorException(funnelResult.error);
    if (!funnelResult.data) throw new NotFoundException(await this.i18n.t('errors.funnelNotFoundWithId', { args: { id: funnelId } }));
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
