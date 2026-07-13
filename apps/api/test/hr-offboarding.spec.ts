/**
 * hr-offboarding.spec.ts — Phase 7 T7.1
 *
 * Coverage:
 *   - OffboardingWorkflowService domain logic (transitions, checklist, finalize gate)
 *   - HrOffboardingService orchestration (create + interview + finalize + cancel)
 *
 * No real DB; repository is mocked.
 */

jest.mock('../src/shared/db', () => ({
  db: {},
  rawSql: jest.fn(),
  runQuery: jest.fn(),
}));

import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OffboardingWorkflowService,
  STANDARD_OFFBOARDING_CHECKLIST,
  type OffboardingStatus,
} from '../src/modules/hr/offboarding/offboarding-workflow.service';
import { HrOffboardingService } from '../src/modules/hr/offboarding/hr-offboarding.service';
import { Ok, Err } from '../src/common/result';

// ============================================================================
// OffboardingWorkflowService
// ============================================================================
describe('OffboardingWorkflowService — T7.1 domain logic', () => {
  let wf: OffboardingWorkflowService;
  beforeEach(() => { wf = new OffboardingWorkflowService(); });

  it('defaultChecklist returns 8 items in order', () => {
    const list = wf.defaultChecklist();
    expect(list).toHaveLength(STANDARD_OFFBOARDING_CHECKLIST.length);
    expect(list).toHaveLength(8);
    // Ordered ascending by order_num
    const orders = list.map((i) => i.order_num);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('canTransition: active → exit_interviewed allowed', () => {
    expect(wf.canTransition('active', 'exit_interviewed')).toBe(true);
  });

  it('canTransition: active → completed ALLOWED (exit interview is optional — vision fix 2026-07-13)', () => {
    expect(wf.canTransition('active', 'completed')).toBe(true);
  });

  it('canTransition: exit_interviewed → completed allowed', () => {
    expect(wf.canTransition('exit_interviewed', 'completed')).toBe(true);
  });

  it('canTransition: completed → anything FORBIDDEN (terminal)', () => {
    const targets: OffboardingStatus[] = ['active', 'exit_interviewed', 'cancelled'];
    for (const t of targets) {
      expect(wf.canTransition('completed', t)).toBe(false);
    }
  });

  it('canTransition: cancellable from active and exit_interviewed', () => {
    expect(wf.canTransition('active', 'cancelled')).toBe(true);
    expect(wf.canTransition('exit_interviewed', 'cancelled')).toBe(true);
  });

  it('assertTransition returns Err with INVALID_TRANSITION for bad jump', () => {
    const r = wf.assertTransition('completed', 'active');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INVALID_TRANSITION');
  });

  it('computeProgress: 0/8 → 0', () => {
    expect(wf.computeProgress({ total_items: 8, completed_items: 0 })).toBe(0);
  });

  it('computeProgress: 4/8 → 50', () => {
    expect(wf.computeProgress({ total_items: 8, completed_items: 4 })).toBe(50);
  });

  it('computeProgress: total=0 → 0 (safe div)', () => {
    expect(wf.computeProgress({ total_items: 0, completed_items: 5 })).toBe(0);
  });

  it('computeProgress: completed > total → clamps to 100', () => {
    expect(wf.computeProgress({ total_items: 8, completed_items: 12 })).toBe(100);
  });

  it('canFinalize: status=completed (terminal) → INVALID_TRANSITION', () => {
    const r = wf.canFinalize({
      status: 'completed',
      total_items: 8,
      completed_items: 7,
      exit_interview_recorded: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INVALID_TRANSITION');
  });

  it('canFinalize: status=active + required items done + NO interview recorded → Ok (vision fix: interview optional, not blocking)', () => {
    const r = wf.canFinalize({
      status: 'active',
      total_items: 8,
      completed_items: 6, // 6 required items (exit_interview + archive_documents are optional)
      exit_interview_recorded: false,
    });
    expect(r.ok).toBe(true);
  });

  it('canFinalize: required items not done → BUSINESS_RULE_VIOLATION', () => {
    const r = wf.canFinalize({
      status: 'exit_interviewed',
      total_items: 8,
      completed_items: 2,
      exit_interview_recorded: true,
    });
    expect(r.ok).toBe(false);
  });

  it('canFinalize: all required + interview → Ok with progressPercent', () => {
    const r = wf.canFinalize({
      status: 'exit_interviewed',
      total_items: 8,
      completed_items: 8,
      exit_interview_recorded: true,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.progressPercent).toBe(100);
  });

  it('validateInterviewRating: 5 → Ok(5)', () => {
    const r = wf.validateInterviewRating(5);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(5);
  });

  it('validateInterviewRating: 11 → VALIDATION', () => {
    const r = wf.validateInterviewRating(11);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('validateInterviewRating: undefined → Ok(undefined)', () => {
    const r = wf.validateInterviewRating(undefined);
    expect(r.ok).toBe(true);
  });

  it('validateDismissalType: voluntary → Ok', () => {
    const r = wf.validateDismissalType('voluntary');
    expect(r.ok).toBe(true);
  });

  it('validateDismissalType: garbage → VALIDATION', () => {
    const r = wf.validateDismissalType('alien_abduction');
    expect(r.ok).toBe(false);
  });
});

// ============================================================================
// HrOffboardingService orchestration with mocked repo + event emitter
// ============================================================================
describe('HrOffboardingService — T7.1 orchestration', () => {
  type RepoMock = {
    createCase: jest.Mock;
    findActiveCaseByEmployee: jest.Mock;
    insertChecklistItems: jest.Mock;
    listChecklistItems: jest.Mock;
    updateChecklistItem: jest.Mock;
    findChecklistItemByKey: jest.Mock;
    updateStatus: jest.Mock;
    recordExitInterview: jest.Mock;
    finalizeCase: jest.Mock;
    findCaseById: jest.Mock;
    findCaseDetailById: jest.Mock;
    listCases: jest.Mock;
    stats: jest.Mock;
  };
  let repo: RepoMock;
  let svc: HrOffboardingService;
  let emitter: EventEmitter2;

  beforeEach(() => {
    repo = {
      createCase: jest.fn(),
      findActiveCaseByEmployee: jest.fn().mockResolvedValue(Ok(null)),
      insertChecklistItems: jest.fn(),
      listChecklistItems: jest.fn(),
      updateChecklistItem: jest.fn().mockResolvedValue(Ok({})),
      findChecklistItemByKey: jest.fn().mockResolvedValue(Ok(null)),
      updateStatus: jest.fn(),
      recordExitInterview: jest.fn(),
      finalizeCase: jest.fn(),
      findCaseById: jest.fn(),
      findCaseDetailById: jest.fn(),
      listCases: jest.fn(),
      stats: jest.fn(),
    };
    emitter = new EventEmitter2();
    jest.spyOn(emitter, 'emit');
    svc = new HrOffboardingService(repo as never, new OffboardingWorkflowService(), emitter);
  });

  it('createCase: bad dismissal_type → VALIDATION (no DB call)', async () => {
    const r = await svc.createCase({ employeeId: 5, dismissalType: 'alien' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
    expect(repo.createCase).not.toHaveBeenCalled();
  });

  it('createCase: employee already has an active case → CONFLICT (no DB insert)', async () => {
    repo.findActiveCaseByEmployee.mockResolvedValueOnce(Ok({ id: 1, employee_id: 5, status: 'active' }));
    const r = await svc.createCase({ employeeId: 5, dismissalType: 'resignation' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('CONFLICT');
    expect(repo.createCase).not.toHaveBeenCalled();
  });

  it('createCase: success → seeds checklist + emits OFFBOARDING_STARTED', async () => {
    repo.createCase.mockResolvedValueOnce(Ok({ id: 42, employee_id: 5, status: 'active', total_items: 8 }));
    repo.insertChecklistItems.mockResolvedValueOnce(Ok([{ id: 1 }, { id: 2 }]));

    const r = await svc.createCase({ employeeId: 5, dismissalType: 'voluntary', initiatedBy: 7 });
    expect(r.ok).toBe(true);
    expect(repo.createCase).toHaveBeenCalledWith(
      expect.objectContaining({ employeeId: 5, totalItems: 8 }),
    );
    expect(repo.insertChecklistItems).toHaveBeenCalledWith(42, expect.any(Array));
    expect(emitter.emit).toHaveBeenCalledWith(
      'offboarding.started',
      expect.objectContaining({ caseId: 42, employeeId: 5 }),
    );
  });

  it('createCase: db failure on createCase → propagates Err', async () => {
    repo.createCase.mockResolvedValueOnce(Err('boom'));
    const r = await svc.createCase({ employeeId: 5 });
    expect(r.ok).toBe(false);
    expect(repo.insertChecklistItems).not.toHaveBeenCalled();
  });

  it('recordExitInterview: case missing → NOT_FOUND', async () => {
    repo.findCaseById.mockResolvedValueOnce(Ok(null));
    const r = await svc.recordExitInterview(99, {});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('recordExitInterview: already exit_interviewed → INVALID_TRANSITION', async () => {
    repo.findCaseById.mockResolvedValueOnce(Ok({ id: 1, status: 'exit_interviewed' }));
    const r = await svc.recordExitInterview(1, { rating: 5 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INVALID_TRANSITION');
  });

  it('recordExitInterview: invalid rating → VALIDATION', async () => {
    const r = await svc.recordExitInterview(1, { rating: 99 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
    expect(repo.findCaseById).not.toHaveBeenCalled();
  });

  it('recordExitInterview: happy path serializes JSON notes', async () => {
    repo.findCaseById.mockResolvedValueOnce(Ok({ id: 1, status: 'active' }));
    repo.recordExitInterview.mockResolvedValueOnce(Ok({ id: 1, status: 'exit_interviewed' }));
    const r = await svc.recordExitInterview(1, {
      rating: 8, wouldReturn: true, mainReason: 'Career', feedback: 'OK', improvements: '-',
    });
    expect(r.ok).toBe(true);
    const notesArg = repo.recordExitInterview.mock.calls[0][1] as { notes: string; reason: string; blocksSettlement: boolean };
    const parsed = JSON.parse(notesArg.notes);
    expect(parsed.rating).toBe(8);
    expect(parsed.would_return).toBe(true);
    // A legacy mainReason was given, so this is NOT treated as a skip/no-response.
    expect(notesArg.reason).toBe('Career');
  });

  it('recordExitInterview: no answers + no mainReason → treated as skip, reason = "Javob bermadi"', async () => {
    repo.findCaseById.mockResolvedValueOnce(Ok({ id: 1, status: 'active' }));
    repo.recordExitInterview.mockResolvedValueOnce(Ok({ id: 1, status: 'exit_interviewed' }));
    const r = await svc.recordExitInterview(1, {});
    expect(r.ok).toBe(true);
    const arg = repo.recordExitInterview.mock.calls[0][1] as { reason: string; blocksSettlement: boolean };
    expect(arg.reason).toBe('Javob bermadi');
    expect(arg.blocksSettlement).toBe(false);
    if (r.ok) expect((r.data as { answersComplete: boolean }).answersComplete).toBe(false);
  });

  it('recordExitInterview: explicit skipped:true → reason = "Javob bermadi" even with partial answers', async () => {
    repo.findCaseById.mockResolvedValueOnce(Ok({ id: 1, status: 'active' }));
    repo.recordExitInterview.mockResolvedValueOnce(Ok({ id: 1, status: 'exit_interviewed' }));
    const r = await svc.recordExitInterview(1, { skipped: true, answers: { reason_for_leaving: 'ignored' } });
    expect(r.ok).toBe(true);
    const arg = repo.recordExitInterview.mock.calls[0][1] as { reason: string };
    expect(arg.reason).toBe('Javob bermadi');
  });

  it('finalizeCase: status completed (terminal) → INVALID_TRANSITION', async () => {
    repo.findCaseById.mockResolvedValueOnce(Ok({
      id: 1, employee_id: 9, status: 'completed', total_items: 8, completed_items: 8,
    }));
    const r = await svc.finalizeCase(1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INVALID_TRANSITION');
  });

  it('finalizeCase: status active + required items done + interview NEVER recorded → Ok (vision fix)', async () => {
    repo.findCaseById.mockResolvedValueOnce(Ok({
      id: 1, employee_id: 9, status: 'active', total_items: 8, completed_items: 6,
    }));
    repo.finalizeCase.mockResolvedValueOnce(Ok({ id: 1, status: 'completed' }));
    const r = await svc.finalizeCase(1);
    expect(r.ok).toBe(true);
  });

  it('finalizeCase: required items missing → BUSINESS_RULE_VIOLATION', async () => {
    repo.findCaseById.mockResolvedValueOnce(Ok({
      id: 1, employee_id: 9, status: 'exit_interviewed', total_items: 8, completed_items: 2,
    }));
    const r = await svc.finalizeCase(1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('finalizeCase: success → emits OFFBOARDING_COMPLETED', async () => {
    repo.findCaseById.mockResolvedValueOnce(Ok({
      id: 1, employee_id: 9, status: 'exit_interviewed', total_items: 8, completed_items: 8,
    }));
    repo.finalizeCase.mockResolvedValueOnce(Ok({ id: 1, status: 'completed' }));
    const r = await svc.finalizeCase(1);
    expect(r.ok).toBe(true);
    expect(emitter.emit).toHaveBeenCalledWith(
      'offboarding.completed',
      expect.objectContaining({ caseId: 1, employeeId: 9 }),
    );
  });

  it('cancelCase: completed → INVALID_TRANSITION', async () => {
    repo.findCaseById.mockResolvedValueOnce(Ok({ id: 1, status: 'completed' }));
    const r = await svc.cancelCase(1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INVALID_TRANSITION');
  });

  it('cancelCase: from active → updateStatus(cancelled)', async () => {
    repo.findCaseById.mockResolvedValueOnce(Ok({ id: 1, status: 'active' }));
    repo.updateStatus.mockResolvedValueOnce(Ok({ id: 1, status: 'cancelled' }));
    const r = await svc.cancelCase(1, 'duplicate case');
    expect(r.ok).toBe(true);
    expect(repo.updateStatus).toHaveBeenCalledWith(1, 'cancelled');
  });

  it('getCaseDetail: returns merged case + items + progress_percent', async () => {
    repo.findCaseDetailById.mockResolvedValueOnce(Ok({ id: 1, total_items: 8, completed_items: 4 }));
    repo.listChecklistItems.mockResolvedValueOnce(Ok([{ id: 100 }]));
    const r = await svc.getCaseDetail(1);
    expect(r.ok).toBe(true);
    if (r.ok && r.data) {
      expect((r.data as { progress_percent: number }).progress_percent).toBe(50);
      expect((r.data as { checklist: unknown[] }).checklist).toHaveLength(1);
      expect((r.data as { checklist_items: unknown[] }).checklist_items).toHaveLength(1);
    }
  });
});
