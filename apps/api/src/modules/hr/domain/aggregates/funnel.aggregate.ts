/**
 * @module funnel.aggregate
 * @description Funnel aggregate root — represents one candidate's journey
 * through the recruitment pipeline. Owns the VALID_TRANSITIONS graph (moved
 * here from `recruitment-funnel.service.ts` per HR audit task H.9) so the
 * state machine is enforced inside the domain instead of inside a service.
 *
 * Pattern: mirrors LeaveRequest / PayrollRecord — private `props` bag,
 * value-object `FunnelStage`, `Result<void>` transitions, internal
 * `events: DomainEvent[]` buffer drained via `getDomainEvents()` +
 * `clearDomainEvents()` after persistence.
 *
 * Transition methods:
 *   - moveStage(to)              — generic next-step move; validates against
 *                                  VALID_TRANSITIONS and emits
 *                                  CandidateMovedFunnelStageEvent
 *   - reject(reason)             — terminal; emits CandidateRejectedEvent
 *   - makeOffer(amount, ...)     — moves to OFFER_SENT; emits OfferMadeEvent
 *   - hire(employeeId)           — terminal; emits CandidateHiredEvent;
 *                                  requires current stage = OFFER_SENT
 */

import { Logger } from '@nestjs/common';
import { TashkentTimeService } from '@common/time';
import { Result, Ok, Err, AppErr } from '@common/types/result.type';
import { DomainEvent } from '@shared/domain/domain-event';
import { FunnelStage, FunnelStageValue } from '../value-objects/funnel-stage.vo';
import { CandidateMovedFunnelStageEvent } from '../events/candidate-moved-funnel-stage.event';
import { CandidateRejectedEvent } from '../events/candidate-rejected.event';
import { OfferMadeEvent } from '../events/offer-made.event';
import { CandidateHiredEvent } from '../events/candidate-hired.event';

const _time = new TashkentTimeService();

export interface FunnelOfferDetails {
  amount: number;
  currency: string;
  startDate: Date;
}

export interface FunnelProps {
  id: number;
  candidateId: number;
  vacancyId: number;
  currentStage: FunnelStage;
  rejectionReason: string | null;
  offerDetails: FunnelOfferDetails | null;
  hiredEmployeeId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Raw shape used by `fromProps` when hydrating from DB rows. */
export interface FunnelRawProps {
  id: number;
  candidateId: number;
  vacancyId: number;
  currentStage: string;
  rejectionReason?: string | null;
  offerDetails?: FunnelOfferDetails | null;
  hiredEmployeeId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Funnel {
  private readonly logger = new Logger(Funnel.name);
  private events: DomainEvent[] = [];

  /**
   * The state-machine graph. Lifted from the (now-removed) module constant
   * `VALID_TRANSITIONS` in `recruitment-funnel.service.ts`. Source of truth
   * for what counts as a legal stage move.
   */
  static readonly VALID_TRANSITIONS: Record<FunnelStageValue, FunnelStageValue[]> = {
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

  private constructor(private props: FunnelProps) {}

  /**
   * Build a brand-new Funnel for a candidate. Always starts at stage NEW
   * with no offer/hire/rejection metadata.
   */
  static create(args: {
    id: number;
    candidateId: number;
    vacancyId: number;
    createdAt?: Date;
  }): Result<Funnel> {
    const stageR = FunnelStage.create('NEW');
    if (!stageR.ok) return Err(stageR.error);

    const now = args.createdAt ?? _time.now();
    return Ok(
      new Funnel({
        id: args.id,
        candidateId: args.candidateId,
        vacancyId: args.vacancyId,
        currentStage: stageR.data,
        rejectionReason: null,
        offerDetails: null,
        hiredEmployeeId: null,
        createdAt: now,
        updatedAt: now,
      }),
    );
  }

  /** Hydrate from a persisted row. Returns Err if the stage string is unknown. */
  static fromProps(props: FunnelRawProps): Result<Funnel> {
    const stageR = FunnelStage.create(props.currentStage);
    if (!stageR.ok) return Err(stageR.error);

    return Ok(
      new Funnel({
        id: props.id,
        candidateId: props.candidateId,
        vacancyId: props.vacancyId,
        currentStage: stageR.data,
        rejectionReason: props.rejectionReason ?? null,
        offerDetails: props.offerDetails ?? null,
        hiredEmployeeId: props.hiredEmployeeId ?? null,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      }),
    );
  }

  // ─── Getters ────────────────────────────────────────────────────────────
  get id(): number { return this.props.id; }
  get candidateId(): number { return this.props.candidateId; }
  get vacancyId(): number { return this.props.vacancyId; }
  get currentStage(): FunnelStage { return this.props.currentStage; }
  get rejectionReason(): string | null { return this.props.rejectionReason; }
  get offerDetails(): FunnelOfferDetails | null { return this.props.offerDetails; }
  get hiredEmployeeId(): number | null { return this.props.hiredEmployeeId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  /** True when the funnel is in a terminal stage (HIRED / REJECTED). */
  get isClosed(): boolean {
    const v = this.props.currentStage.getValue();
    return v === 'HIRED' || v === 'REJECTED';
  }

  // ─── State transitions ──────────────────────────────────────────────────

  /**
   * Move the candidate to a new stage. Validates the transition against
   * `Funnel.VALID_TRANSITIONS`. Use the dedicated `reject`, `makeOffer`, or
   * `hire` methods for the terminal/offer transitions so the right event
   * type is emitted with its payload.
   */
  moveStage(to: FunnelStage): Result<void> {
    if (this.isClosed) {
      return Err(AppErr('INVALID_TRANSITION', "Yopilgan funnel bosqichini o'zgartirib bo'lmaydi"));
    }
    const from = this.props.currentStage.getValue();
    const target = to.getValue();
    const allowed = Funnel.VALID_TRANSITIONS[from] ?? [];
    if (!allowed.includes(target)) {
      return Err(AppErr(
        'INVALID_TRANSITION',
        `${from} bosqichidan ${target} bosqichiga o'tish mumkin emas. Ruxsat etilgan: [${allowed.join(', ')}]`,
      ));
    }
    const now = _time.now();
    this.props.currentStage = to;
    this.props.updatedAt = now;
    this.events.push(new CandidateMovedFunnelStageEvent({
      funnelId: this.props.id,
      candidateId: this.props.candidateId,
      fromStage: from,
      toStage: target,
      movedAt: now,
    }));
    return Ok();
  }

  /**
   * Reject the candidate from any non-terminal stage. Stores the reason
   * and emits CandidateRejectedEvent.
   */
  reject(reason: string): Result<void> {
    if (typeof reason !== 'string' || reason.trim().length === 0) {
      return Err(AppErr('VALIDATION', "Rad etish sababi ko'rsatilishi shart"));
    }
    if (this.isClosed) {
      return Err(AppErr('INVALID_TRANSITION', "Yopilgan funnel rad etib bo'lmaydi"));
    }
    const from = this.props.currentStage.getValue();
    const allowed = Funnel.VALID_TRANSITIONS[from] ?? [];
    if (!allowed.includes('REJECTED')) {
      return Err(AppErr(
        'INVALID_TRANSITION',
        `${from} bosqichidan REJECTED bosqichiga o'tish mumkin emas`,
      ));
    }
    const rejectedR = FunnelStage.create('REJECTED');
    if (!rejectedR.ok) return Err(rejectedR.error);

    const now = _time.now();
    this.props.currentStage = rejectedR.data;
    this.props.rejectionReason = reason;
    this.props.updatedAt = now;
    this.events.push(new CandidateRejectedEvent({
      funnelId: this.props.id,
      candidateId: this.props.candidateId,
      reason,
      rejectedAt: now,
    }));
    return Ok();
  }

  /**
   * Move the candidate to OFFER_SENT with the offer payload. Validates the
   * transition (REFERENCES_CHECK or PROBATION → OFFER_SENT) and emits
   * OfferMadeEvent.
   */
  makeOffer(amount: number, currency: string, startDate: Date): Result<void> {
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return Err(AppErr('VALIDATION', `Offer summasi musbat son bo'lishi kerak (got ${amount})`));
    }
    if (typeof currency !== 'string' || currency.length !== 3) {
      return Err(AppErr('VALIDATION', `Valyuta kodi 3 belgili bo'lishi kerak (got ${currency})`));
    }
    if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) {
      return Err(AppErr('VALIDATION', 'Ish boshlash sanasi noto\'g\'ri'));
    }
    if (this.isClosed) {
      return Err(AppErr('INVALID_TRANSITION', "Yopilgan funnel uchun offer chiqarib bo'lmaydi"));
    }
    const from = this.props.currentStage.getValue();
    const allowed = Funnel.VALID_TRANSITIONS[from] ?? [];
    if (!allowed.includes('OFFER_SENT')) {
      return Err(AppErr(
        'INVALID_TRANSITION',
        `${from} bosqichidan OFFER_SENT bosqichiga o'tish mumkin emas`,
      ));
    }
    const offerR = FunnelStage.create('OFFER_SENT');
    if (!offerR.ok) return Err(offerR.error);

    const now = _time.now();
    const cur = currency.toUpperCase();
    this.props.currentStage = offerR.data;
    this.props.offerDetails = { amount, currency: cur, startDate };
    this.props.updatedAt = now;
    this.events.push(new OfferMadeEvent({
      funnelId: this.props.id,
      candidateId: this.props.candidateId,
      amount,
      currency: cur,
      startDate,
      madeAt: now,
    }));
    return Ok();
  }

  /**
   * Hire the candidate. Only allowed from OFFER_SENT. Stores the resulting
   * employeeId and emits CandidateHiredEvent.
   */
  hire(employeeId: number): Result<void> {
    if (typeof employeeId !== 'number' || !Number.isInteger(employeeId) || employeeId <= 0) {
      return Err(AppErr('VALIDATION', `Employee id musbat butun son bo'lishi kerak (got ${employeeId})`));
    }
    if (this.isClosed) {
      return Err(AppErr('INVALID_TRANSITION', "Yopilgan funnel uchun yollab bo'lmaydi"));
    }
    if (this.props.currentStage.getValue() !== 'OFFER_SENT') {
      return Err(AppErr(
        'INVALID_TRANSITION',
        `Faqat OFFER_SENT bosqichidan HIRED ga o'tish mumkin (current: ${this.props.currentStage.getValue()})`,
      ));
    }
    const hiredR = FunnelStage.create('HIRED');
    if (!hiredR.ok) return Err(hiredR.error);

    const now = _time.now();
    this.props.currentStage = hiredR.data;
    this.props.hiredEmployeeId = employeeId;
    this.props.updatedAt = now;
    this.events.push(new CandidateHiredEvent({
      funnelId: this.props.id,
      candidateId: this.props.candidateId,
      employeeId,
      hiredAt: now,
    }));
    return Ok();
  }

  // ─── Event buffer ───────────────────────────────────────────────────────
  getDomainEvents(): DomainEvent[] {
    return this.events;
  }

  clearDomainEvents(): void {
    this.events = [];
  }
}
