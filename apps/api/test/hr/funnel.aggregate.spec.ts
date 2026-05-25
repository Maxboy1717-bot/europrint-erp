/**
 * @module test/hr/funnel.aggregate.spec
 * @description Unit tests for FunnelStage value object + Funnel aggregate
 * (HR audit task H.9 — recruitment funnel promoted from procedural service
 * to a DDD aggregate). Covers the VALID_TRANSITIONS state machine, the
 * dedicated terminal methods (reject / makeOffer / hire), and the
 * domain-event drain semantics shared with PayrollRecord / LeaveRequest.
 */

import { FunnelStage } from '../../src/modules/hr/domain/value-objects/funnel-stage.vo';
import {
  Funnel,
  FunnelRawProps,
} from '../../src/modules/hr/domain/aggregates/funnel.aggregate';
import { CandidateMovedFunnelStageEvent } from '../../src/modules/hr/domain/events/candidate-moved-funnel-stage.event';
import { CandidateRejectedEvent } from '../../src/modules/hr/domain/events/candidate-rejected.event';
import { OfferMadeEvent } from '../../src/modules/hr/domain/events/offer-made.event';
import { CandidateHiredEvent } from '../../src/modules/hr/domain/events/candidate-hired.event';

// ─── Helpers ────────────────────────────────────────────────────────────────
function unwrap<T>(r: { ok: true; data: T } | { ok: false; error: { message: string } }): T {
  if (!r.ok) throw new Error(`Expected Ok but got Err: ${r.error.message}`);
  return r.data;
}

function baseRawProps(over: Partial<FunnelRawProps> = {}): FunnelRawProps {
  const now = new Date('2026-05-17T00:00:00Z');
  return {
    id: 1,
    candidateId: 100,
    vacancyId: 7,
    currentStage: 'NEW',
    rejectionReason: null,
    offerDetails: null,
    hiredEmployeeId: null,
    createdAt: now,
    updatedAt: now,
    ...over,
  };
}

function stage(value: string): FunnelStage {
  return unwrap(FunnelStage.create(value));
}

// ─── FunnelStage VO ─────────────────────────────────────────────────────────
describe('FunnelStage.create', () => {
  it('accepts every canonical stage name', () => {
    const stages = [
      'NEW', 'QUESTIONNAIRE_SENT', 'PHONE_SCREENING', 'INTERVIEW_SCHEDULED',
      'INTERVIEWED', 'TEST_SENT', 'TEST_ANALYSIS', 'REFERENCES_CHECK',
      'PROBATION', 'OFFER_SENT', 'HIRED', 'REJECTED',
    ];
    for (const s of stages) {
      const r = FunnelStage.create(s);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.getValue()).toBe(s);
    }
  });

  it('rejects an unknown stage name', () => {
    const r = FunnelStage.create('ARCHIVED');
    expect(r.ok).toBe(false);
  });

  it('rejects an empty string', () => {
    const r = FunnelStage.create('');
    expect(r.ok).toBe(false);
  });

  it('equals returns true for the same stage value and false otherwise', () => {
    const a = stage('NEW');
    const b = stage('NEW');
    const c = stage('PHONE_SCREENING');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});

// ─── Funnel — factories ─────────────────────────────────────────────────────
describe('Funnel.fromProps', () => {
  it('hydrates with the canonical stage VO and no buffered events', () => {
    const f = unwrap(Funnel.fromProps(baseRawProps()));
    expect(f.id).toBe(1);
    expect(f.candidateId).toBe(100);
    expect(f.vacancyId).toBe(7);
    expect(f.currentStage.getValue()).toBe('NEW');
    expect(f.rejectionReason).toBeNull();
    expect(f.offerDetails).toBeNull();
    expect(f.hiredEmployeeId).toBeNull();
    expect(f.getDomainEvents()).toHaveLength(0);
  });

  it('rejects an unknown stage string', () => {
    const r = Funnel.fromProps(baseRawProps({ currentStage: 'BOGUS' }));
    expect(r.ok).toBe(false);
  });
});

describe('Funnel.create', () => {
  it('starts a brand-new funnel at stage NEW', () => {
    const f = unwrap(Funnel.create({ id: 99, candidateId: 5, vacancyId: 6 }));
    expect(f.currentStage.getValue()).toBe('NEW');
    expect(f.isClosed).toBe(false);
  });
});

// ─── moveStage ──────────────────────────────────────────────────────────────
describe('Funnel.moveStage', () => {
  it('accepts a valid transition (NEW → PHONE_SCREENING) and emits a CandidateMovedFunnelStageEvent', () => {
    const f = unwrap(Funnel.fromProps(baseRawProps({ currentStage: 'NEW' })));
    const r = f.moveStage(stage('PHONE_SCREENING'));
    expect(r.ok).toBe(true);
    expect(f.currentStage.getValue()).toBe('PHONE_SCREENING');
    const events = f.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(CandidateMovedFunnelStageEvent);
    const ev = events[0] as CandidateMovedFunnelStageEvent;
    expect(ev.props.fromStage).toBe('NEW');
    expect(ev.props.toStage).toBe('PHONE_SCREENING');
    expect(ev.props.funnelId).toBe(1);
    expect(ev.props.candidateId).toBe(100);
  });

  it('rejects an invalid transition (NEW → HIRED) and buffers no event', () => {
    const f = unwrap(Funnel.fromProps(baseRawProps({ currentStage: 'NEW' })));
    const r = f.moveStage(stage('HIRED'));
    expect(r.ok).toBe(false);
    expect(f.currentStage.getValue()).toBe('NEW');
    expect(f.getDomainEvents()).toHaveLength(0);
  });

  it('rejects a transition from a terminal stage', () => {
    const f = unwrap(Funnel.fromProps(baseRawProps({ currentStage: 'HIRED' })));
    const r = f.moveStage(stage('PHONE_SCREENING'));
    expect(r.ok).toBe(false);
  });

  it('rejects applied→hired-equivalent (NEW→TEST_SENT) since intermediate steps are required', () => {
    const f = unwrap(Funnel.fromProps(baseRawProps({ currentStage: 'NEW' })));
    const r = f.moveStage(stage('TEST_SENT'));
    expect(r.ok).toBe(false);
  });
});

// ─── reject ─────────────────────────────────────────────────────────────────
describe('Funnel.reject', () => {
  it('transitions to REJECTED and emits CandidateRejectedEvent with the reason', () => {
    const f = unwrap(Funnel.fromProps(baseRawProps({ currentStage: 'INTERVIEWED' })));
    const r = f.reject('KPI past');
    expect(r.ok).toBe(true);
    expect(f.currentStage.getValue()).toBe('REJECTED');
    expect(f.rejectionReason).toBe('KPI past');
    expect(f.isClosed).toBe(true);
    const events = f.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(CandidateRejectedEvent);
    expect((events[0] as CandidateRejectedEvent).props.reason).toBe('KPI past');
  });

  it('requires a non-empty reason', () => {
    const f = unwrap(Funnel.fromProps(baseRawProps()));
    expect(f.reject('').ok).toBe(false);
    expect(f.reject('   ').ok).toBe(false);
    expect(f.getDomainEvents()).toHaveLength(0);
  });

  it('refuses to re-reject a closed funnel', () => {
    const f = unwrap(Funnel.fromProps(baseRawProps({ currentStage: 'REJECTED' })));
    expect(f.reject('again').ok).toBe(false);
  });
});

// ─── makeOffer ──────────────────────────────────────────────────────────────
describe('Funnel.makeOffer', () => {
  it('transitions REFERENCES_CHECK → OFFER_SENT and emits OfferMadeEvent with the payload', () => {
    const f = unwrap(Funnel.fromProps(baseRawProps({ currentStage: 'REFERENCES_CHECK' })));
    const startDate = new Date('2026-06-01T00:00:00Z');
    const r = f.makeOffer(15_000_000, 'UZS', startDate);
    expect(r.ok).toBe(true);
    expect(f.currentStage.getValue()).toBe('OFFER_SENT');
    expect(f.offerDetails).toEqual({ amount: 15_000_000, currency: 'UZS', startDate });
    const events = f.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(OfferMadeEvent);
    const ev = events[0] as OfferMadeEvent;
    expect(ev.props.amount).toBe(15_000_000);
    expect(ev.props.currency).toBe('UZS');
    expect(ev.props.startDate).toEqual(startDate);
    expect(ev.props.funnelId).toBe(1);
    expect(ev.props.candidateId).toBe(100);
  });

  it('upper-cases the currency code', () => {
    const f = unwrap(Funnel.fromProps(baseRawProps({ currentStage: 'PROBATION' })));
    const r = f.makeOffer(1_000_000, 'usd', new Date('2026-06-01'));
    expect(r.ok).toBe(true);
    expect(f.offerDetails?.currency).toBe('USD');
  });

  it('rejects when the current stage cannot transition to OFFER_SENT', () => {
    const f = unwrap(Funnel.fromProps(baseRawProps({ currentStage: 'NEW' })));
    const r = f.makeOffer(1_000_000, 'UZS', new Date('2026-06-01'));
    expect(r.ok).toBe(false);
    expect(f.getDomainEvents()).toHaveLength(0);
  });

  it('rejects an invalid amount, currency, or startDate', () => {
    const f = unwrap(Funnel.fromProps(baseRawProps({ currentStage: 'REFERENCES_CHECK' })));
    expect(f.makeOffer(0, 'UZS', new Date('2026-06-01')).ok).toBe(false);
    expect(f.makeOffer(-1, 'UZS', new Date('2026-06-01')).ok).toBe(false);
    expect(f.makeOffer(100, 'UZSD', new Date('2026-06-01')).ok).toBe(false);
    expect(f.makeOffer(100, 'UZS', new Date('not-a-date')).ok).toBe(false);
  });
});

// ─── hire ───────────────────────────────────────────────────────────────────
describe('Funnel.hire', () => {
  it('transitions OFFER_SENT → HIRED and emits CandidateHiredEvent', () => {
    const f = unwrap(Funnel.fromProps(baseRawProps({ currentStage: 'OFFER_SENT' })));
    const r = f.hire(42);
    expect(r.ok).toBe(true);
    expect(f.currentStage.getValue()).toBe('HIRED');
    expect(f.hiredEmployeeId).toBe(42);
    expect(f.isClosed).toBe(true);
    const events = f.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(CandidateHiredEvent);
    expect((events[0] as CandidateHiredEvent).props.employeeId).toBe(42);
  });

  it('rejects when the current stage is not OFFER_SENT', () => {
    const f = unwrap(Funnel.fromProps(baseRawProps({ currentStage: 'INTERVIEWED' })));
    const r = f.hire(42);
    expect(r.ok).toBe(false);
    expect(f.currentStage.getValue()).toBe('INTERVIEWED');
    expect(f.getDomainEvents()).toHaveLength(0);
  });

  it('rejects an invalid employeeId', () => {
    const f = unwrap(Funnel.fromProps(baseRawProps({ currentStage: 'OFFER_SENT' })));
    expect(f.hire(0).ok).toBe(false);
    expect(f.hire(-1).ok).toBe(false);
    expect(f.hire(1.5).ok).toBe(false);
  });
});

// ─── event drain ────────────────────────────────────────────────────────────
describe('Funnel event drain', () => {
  it('clearDomainEvents empties the buffer', () => {
    const f = unwrap(Funnel.fromProps(baseRawProps({ currentStage: 'NEW' })));
    expect(f.moveStage(stage('PHONE_SCREENING')).ok).toBe(true);
    expect(f.getDomainEvents()).toHaveLength(1);
    f.clearDomainEvents();
    expect(f.getDomainEvents()).toHaveLength(0);
  });

  it('accumulates multiple events across transitions until drained', () => {
    const f = unwrap(Funnel.fromProps(baseRawProps({ currentStage: 'NEW' })));
    expect(f.moveStage(stage('PHONE_SCREENING')).ok).toBe(true);
    expect(f.moveStage(stage('INTERVIEW_SCHEDULED')).ok).toBe(true);
    expect(f.getDomainEvents()).toHaveLength(2);
    f.clearDomainEvents();
    expect(f.getDomainEvents()).toHaveLength(0);
  });
});
