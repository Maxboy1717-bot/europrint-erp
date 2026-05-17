/**
 * Phase 5, Task 5.2 — RecruitmentFunnelService must emit
 * `candidate.stage-changed` after a successful funnel stage transition.
 *
 * Covered:
 *  - Valid transition succeeds, history is recorded, event is emitted
 *    with the right payload.
 *  - REJECTED transition sets the rejection metadata and still emits.
 *  - HIRED transition stamps hiredAt and emits with toStage HIRED.
 *  - Invalid transition throws and does NOT emit.
 *  - REFERENCES_CHECK requires at least one references check row.
 *  - Yopilgan (inactive) funnelni o'zgartirib bo'lmaydi.
 */
import 'reflect-metadata';
import {
  RecruitmentFunnelService,
  CANDIDATE_STAGE_CHANGED_EVENT,
  type CandidateStageChangedPayload,
} from '../../src/modules/hr/recruitment/recruitment-funnel.service';
import type { IHrRecruitmentFunnelRepository } from '../../src/modules/hr/recruitment/repos/i-hr-recruitment-funnel.repo';
import { Ok, type Result } from '../../src/common/result';

type CandidateFunnelRow = { id: number; funnelStage: string; isActive: boolean; candidateId: number };

interface MockState {
  funnel: CandidateFunnelRow;
  refsCount: number;
}

function buildRepo(state: MockState): jest.Mocked<IHrRecruitmentFunnelRepository> {
  return {
    findCandidateById: jest.fn(),
    findActiveFunnelForCandidate: jest.fn(),
    createFunnel: jest.fn(),
    insertFunnelHistory: jest.fn(async () => Ok({}) as unknown as Result<never>),
    listFunnels: jest.fn(),
    getFunnelById: jest.fn(async () => Ok(state.funnel) as unknown as Result<never>),
    getFunnelKanban: jest.fn(),
    countReferencesChecks: jest.fn(async () => Ok(state.refsCount) as unknown as Result<number>),
    updateFunnel: jest.fn(async (id: number, updates: Record<string, unknown>) => {
      const next = { ...state.funnel, ...updates } as CandidateFunnelRow;
      state.funnel = next;
      return Ok(next) as unknown as Result<CandidateFunnelRow>;
    }),
  } as unknown as jest.Mocked<IHrRecruitmentFunnelRepository>;
}

function buildEmitter() {
  const emit = jest.fn();
  return { emit } as unknown as { emit: jest.Mock } & import('@nestjs/event-emitter').EventEmitter2;
}

function unwrapOk<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(`Expected Ok, got Err: ${JSON.stringify(r.error)}`);
  return r.data;
}

describe('RecruitmentFunnelService.moveFunnelStage event emission', () => {
  it('emits candidate.stage-changed with the correct payload on a valid transition', async () => {
    const state: MockState = {
      funnel: { id: 11, funnelStage: 'NEW', isActive: true, candidateId: 999 },
      refsCount: 0,
    };
    const repo = buildRepo(state);
    const emitter = buildEmitter();
    const svc = new RecruitmentFunnelService(repo, emitter);

    const r = await svc.moveFunnelStage(11, { newStage: 'PHONE_SCREENING', notes: 'OK' } as never, 42);
    expect(r.ok).toBe(true);
    unwrapOk(r);

    expect(repo.updateFunnel).toHaveBeenCalledWith(
      11,
      expect.objectContaining({ funnelStage: 'PHONE_SCREENING' }),
    );
    expect(repo.insertFunnelHistory).toHaveBeenCalledWith(
      expect.objectContaining({ funnelId: 11, fromStage: 'NEW', toStage: 'PHONE_SCREENING', changedById: 42, notes: 'OK' }),
    );
    expect(emitter.emit).toHaveBeenCalledTimes(1);
    const [event, payload] = emitter.emit.mock.calls[0] as [string, CandidateStageChangedPayload];
    expect(event).toBe(CANDIDATE_STAGE_CHANGED_EVENT);
    expect(payload).toMatchObject({
      funnelId: 11,
      candidateId: 999,
      fromStage: 'NEW',
      toStage: 'PHONE_SCREENING',
      changedById: 42,
      notes: 'OK',
    });
    expect(payload.occurredAt).toBeInstanceOf(Date);
  });

  it('emits with toStage HIRED and stamps hiredAt on a hire transition', async () => {
    const state: MockState = {
      funnel: { id: 5, funnelStage: 'OFFER_SENT', isActive: true, candidateId: 50 },
      refsCount: 0,
    };
    const repo = buildRepo(state);
    const emitter = buildEmitter();
    const svc = new RecruitmentFunnelService(repo, emitter);

    const r = await svc.moveFunnelStage(5, { newStage: 'HIRED' } as never, 7);
    expect(r.ok).toBe(true);
    expect(repo.updateFunnel).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ funnelStage: 'HIRED', hiredAt: expect.anything() }),
    );
    const payload = emitter.emit.mock.calls[0]?.[1] as CandidateStageChangedPayload;
    expect(payload.toStage).toBe('HIRED');
  });

  it('emits on REJECTED transition with notes captured as rejectionReason', async () => {
    const state: MockState = {
      funnel: { id: 9, funnelStage: 'INTERVIEWED', isActive: true, candidateId: 90 },
      refsCount: 0,
    };
    const repo = buildRepo(state);
    const emitter = buildEmitter();
    const svc = new RecruitmentFunnelService(repo, emitter);

    const r = await svc.moveFunnelStage(9, { newStage: 'REJECTED', notes: 'KPI past' } as never, 1);
    expect(r.ok).toBe(true);
    expect(repo.updateFunnel).toHaveBeenCalledWith(
      9,
      expect.objectContaining({ funnelStage: 'REJECTED', isActive: false, rejectionReason: 'KPI past' }),
    );
    const payload = emitter.emit.mock.calls[0]?.[1] as CandidateStageChangedPayload;
    expect(payload.toStage).toBe('REJECTED');
    expect(payload.fromStage).toBe('INTERVIEWED');
  });

  it('does NOT emit when the transition is rejected by the state machine', async () => {
    const state: MockState = {
      funnel: { id: 3, funnelStage: 'NEW', isActive: true, candidateId: 30 },
      refsCount: 0,
    };
    const repo = buildRepo(state);
    const emitter = buildEmitter();
    const svc = new RecruitmentFunnelService(repo, emitter);

    // NEW -> HIRED is not in VALID_TRANSITIONS
    const r = await svc.moveFunnelStage(3, { newStage: 'HIRED' } as never, 1);
    expect(r.ok).toBe(false);
    expect(repo.updateFunnel).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('does NOT emit when REFERENCES_CHECK has no underlying records', async () => {
    const state: MockState = {
      funnel: { id: 4, funnelStage: 'TEST_ANALYSIS', isActive: true, candidateId: 40 },
      refsCount: 0,
    };
    const repo = buildRepo(state);
    const emitter = buildEmitter();
    const svc = new RecruitmentFunnelService(repo, emitter);

    const r = await svc.moveFunnelStage(4, { newStage: 'REFERENCES_CHECK' } as never, 1);
    expect(r.ok).toBe(false);
    expect(repo.updateFunnel).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('does NOT emit when the funnel is inactive', async () => {
    const state: MockState = {
      funnel: { id: 2, funnelStage: 'NEW', isActive: false, candidateId: 20 },
      refsCount: 0,
    };
    const repo = buildRepo(state);
    const emitter = buildEmitter();
    const svc = new RecruitmentFunnelService(repo, emitter);

    const r = await svc.moveFunnelStage(2, { newStage: 'PHONE_SCREENING' } as never, 1);
    expect(r.ok).toBe(false);
    expect(emitter.emit).not.toHaveBeenCalled();
  });
});
