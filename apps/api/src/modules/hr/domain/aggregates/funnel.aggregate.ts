/**
 * @module funnel.aggregate
 * @description Funnel aggregate root — one candidate's journey through the
 * recruitment pipeline. Owns the VALID_TRANSITIONS graph (per HR audit task
 * H.9) so the state machine is enforced inside the domain, not a service.
 * Graph + payload validators live in `funnel-helpers.ts` (Rule 16).
 *
 * Pattern mirrors LeaveRequest/PayrollRecord: private `props`, VO stage,
 * `Result<void>` transitions, internal `events` drained after persistence.
 * Transitions: moveStage / reject / makeOffer / hire — each emits the
 * corresponding CQRS event.
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
import {
  VALID_TRANSITIONS,
  ensureNotClosed,
  ensureTransitionAllowed,
  validateRejectReason,
  validateOfferAmount,
  validateCurrency,
  validateStartDate,
  validateEmployeeId,
} from './funnel-helpers';

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

  /** Re-exported for callers that read the graph (tests, repository projection). */
  static readonly VALID_TRANSITIONS: Record<FunnelStageValue, FunnelStageValue[]> =
    VALID_TRANSITIONS;

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
   * Generic stage move. Validates against `Funnel.VALID_TRANSITIONS`.
   * Use `reject` / `makeOffer` / `hire` for transitions that carry payload.
   */
  moveStage(to: FunnelStage): Result<void> {
    const from = this.props.currentStage.getValue();
    const target = to.getValue();
    const guardR = ensureNotClosed(from, "Yopilgan funnel bosqichini o'zgartirib bo'lmaydi");
    if (!guardR.ok) return guardR;
    const transitionR = ensureTransitionAllowed(from, target, true);
    if (!transitionR.ok) return transitionR;

    const now = _time.now();
    this.props.currentStage = to;
    this.props.updatedAt = now;
    this.events.push(new CandidateMovedFunnelStageEvent({
      funnelId: this.props.id, candidateId: this.props.candidateId,
      fromStage: from, toStage: target, movedAt: now,
    }));
    return Ok();
  }

  /** Terminal reject. Stores reason and emits CandidateRejectedEvent. */
  reject(reason: string): Result<void> {
    const reasonR = validateRejectReason(reason);
    if (!reasonR.ok) return Err(reasonR.error);
    const from = this.props.currentStage.getValue();
    const guardR = ensureNotClosed(from, "Yopilgan funnel rad etib bo'lmaydi");
    if (!guardR.ok) return guardR;
    const transitionR = ensureTransitionAllowed(from, 'REJECTED');
    if (!transitionR.ok) return transitionR;
    const rejectedR = FunnelStage.create('REJECTED');
    if (!rejectedR.ok) return Err(rejectedR.error);

    const now = _time.now();
    this.props.currentStage = rejectedR.data;
    this.props.rejectionReason = reasonR.data;
    this.props.updatedAt = now;
    this.events.push(new CandidateRejectedEvent({
      funnelId: this.props.id, candidateId: this.props.candidateId,
      reason: reasonR.data, rejectedAt: now,
    }));
    return Ok();
  }

  /** Move to OFFER_SENT (from REFERENCES_CHECK or PROBATION). Emits OfferMadeEvent. */
  makeOffer(amount: number, currency: string, startDate: Date): Result<void> {
    const amountR = validateOfferAmount(amount);
    if (!amountR.ok) return Err(amountR.error);
    const currencyR = validateCurrency(currency);
    if (!currencyR.ok) return Err(currencyR.error);
    const startDateR = validateStartDate(startDate);
    if (!startDateR.ok) return Err(startDateR.error);

    const from = this.props.currentStage.getValue();
    const guardR = ensureNotClosed(from, "Yopilgan funnel uchun offer chiqarib bo'lmaydi");
    if (!guardR.ok) return guardR;
    const transitionR = ensureTransitionAllowed(from, 'OFFER_SENT');
    if (!transitionR.ok) return transitionR;
    const offerR = FunnelStage.create('OFFER_SENT');
    if (!offerR.ok) return Err(offerR.error);

    const now = _time.now();
    this.props.currentStage = offerR.data;
    this.props.offerDetails = { amount: amountR.data, currency: currencyR.data, startDate: startDateR.data };
    this.props.updatedAt = now;
    this.events.push(new OfferMadeEvent({
      funnelId: this.props.id, candidateId: this.props.candidateId,
      amount: amountR.data, currency: currencyR.data, startDate: startDateR.data, madeAt: now,
    }));
    return Ok();
  }

  /** Terminal hire. Only allowed from OFFER_SENT. Emits CandidateHiredEvent. */
  hire(employeeId: number): Result<void> {
    const employeeIdR = validateEmployeeId(employeeId);
    if (!employeeIdR.ok) return Err(employeeIdR.error);
    const from = this.props.currentStage.getValue();
    const guardR = ensureNotClosed(from, "Yopilgan funnel uchun yollab bo'lmaydi");
    if (!guardR.ok) return guardR;
    if (from !== 'OFFER_SENT') {
      return Err(AppErr('INVALID_TRANSITION',
        `Faqat OFFER_SENT bosqichidan HIRED ga o'tish mumkin (current: ${from})`));
    }
    const hiredR = FunnelStage.create('HIRED');
    if (!hiredR.ok) return Err(hiredR.error);

    const now = _time.now();
    this.props.currentStage = hiredR.data;
    this.props.hiredEmployeeId = employeeIdR.data;
    this.props.updatedAt = now;
    this.events.push(new CandidateHiredEvent({
      funnelId: this.props.id, candidateId: this.props.candidateId,
      employeeId: employeeIdR.data, hiredAt: now,
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
