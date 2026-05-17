/**
 * hr-pip.spec.ts — Phase 7 T7.2
 *
 * Coverage:
 *   - PipWorkflowService: buildPlan, transitions, outcome, overdue
 *   - PipService orchestration: createPip, addProgressUpdate, cancel, extend
 */

jest.mock('../src/shared/db', () => ({
  db: {},
  rawSql: jest.fn(),
  runQuery: jest.fn(),
}));

import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  PipWorkflowService,
  type PipStatus,
} from '../src/modules/hr/pip/pip-workflow.service';
import { PipService } from '../src/modules/hr/pip/pip.service';
import { Ok, Err } from '../src/common/result';

// ============================================================================
// PipWorkflowService
// ============================================================================
describe('PipWorkflowService — T7.2 domain', () => {
  let wf: PipWorkflowService;
  beforeEach(() => { wf = new PipWorkflowService(); });

  it('buildPlan: default duration → 30 days, computed endDate', () => {
    const r = wf.buildPlan(
      { employeeId: 1, createdBy: 2, startDate: '2026-01-01' },
      new Date('2026-01-01T00:00:00Z'),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.durationDays).toBe(30);
      expect(r.data.endDate).toBe('2026-01-31');
    }
  });

  it('buildPlan: duration < 7 → VALIDATION', () => {
    const r = wf.buildPlan({ employeeId: 1, createdBy: 2, durationDays: 3 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('buildPlan: duration > 180 → VALIDATION', () => {
    const r = wf.buildPlan({ employeeId: 1, createdBy: 2, durationDays: 365 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('buildPlan: explicit endDate before startDate → VALIDATION', () => {
    const r = wf.buildPlan({
      employeeId: 1, createdBy: 2,
      startDate: '2026-01-15', endDate: '2026-01-10',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('buildPlan: explicit valid endDate is preserved', () => {
    const r = wf.buildPlan({
      employeeId: 1, createdBy: 2,
      startDate: '2026-01-01', endDate: '2026-03-01',
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.endDate).toBe('2026-03-01');
  });

  it('buildPlan: malformed start_date → VALIDATION', () => {
    const r = wf.buildPlan({ employeeId: 1, createdBy: 2, startDate: 'not-a-date' });
    expect(r.ok).toBe(false);
  });

  it('validateProgressStatus: undefined → on_track', () => {
    const r = wf.validateProgressStatus(undefined);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe('on_track');
  });

  it('validateProgressStatus: garbage → VALIDATION', () => {
    const r = wf.validateProgressStatus('exploded');
    expect(r.ok).toBe(false);
  });

  it('canTransition: active → completed allowed', () => {
    expect(wf.canTransition('active', 'completed')).toBe(true);
  });

  it('canTransition: completed → active FORBIDDEN', () => {
    expect(wf.canTransition('completed', 'active')).toBe(false);
  });

  it('outcomeFromProgress: completed → PASSED', () => {
    expect(wf.outcomeFromProgress('completed')).toEqual({ newStatus: 'completed', outcome: 'PASSED' });
  });

  it('outcomeFromProgress: failed → FAILED', () => {
    expect(wf.outcomeFromProgress('failed')).toEqual({ newStatus: 'failed', outcome: 'FAILED' });
  });

  it('outcomeFromProgress: on_track → null (still active)', () => {
    expect(wf.outcomeFromProgress('on_track')).toEqual({ newStatus: 'active', outcome: null });
  });

  it('isOverdue: active + endDate before today → true', () => {
    expect(wf.isOverdue({ status: 'active', endDate: '2025-12-01' }, '2026-01-01')).toBe(true);
  });

  it('isOverdue: completed status → false (terminal)', () => {
    expect(wf.isOverdue({ status: 'completed', endDate: '2025-12-01' }, '2026-01-01')).toBe(false);
  });

  it('computeElapsedPercent: midway → ~50', () => {
    const pct = wf.computeElapsedPercent({ startDate: '2026-01-01', endDate: '2026-02-01' }, '2026-01-16');
    expect(pct).toBeGreaterThanOrEqual(48);
    expect(pct).toBeLessThanOrEqual(52);
  });
});

// ============================================================================
// PipService orchestration
// ============================================================================
describe('PipService — T7.2 orchestration', () => {
  type RepoMock = {
    createPip: jest.Mock;
    addProgressUpdate: jest.Mock;
    getPip: jest.Mock;
    markCompleted: jest.Mock;
    markFailed: jest.Mock;
    cancel: jest.Mock;
    updateEndDate: jest.Mock;
    acknowledge: jest.Mock;
    getByIdWithEmployee: jest.Mock;
    getProgressUpdates: jest.Mock;
    getByEmployee: jest.Mock;
    getActivePips: jest.Mock;
    listAll: jest.Mock;
    getOverduePips: jest.Mock;
  };
  let repo: RepoMock;
  let svc: PipService;
  let emitter: EventEmitter2;

  beforeEach(() => {
    repo = {
      createPip: jest.fn(),
      addProgressUpdate: jest.fn(),
      getPip: jest.fn(),
      markCompleted: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
      cancel: jest.fn(),
      updateEndDate: jest.fn(),
      acknowledge: jest.fn(),
      getByIdWithEmployee: jest.fn(),
      getProgressUpdates: jest.fn(),
      getByEmployee: jest.fn(),
      getActivePips: jest.fn(),
      listAll: jest.fn(),
      getOverduePips: jest.fn(),
    };
    emitter = new EventEmitter2();
    jest.spyOn(emitter, 'emit');
    svc = new PipService(emitter, repo as never, new PipWorkflowService());
  });

  it('createPip: VALIDATION on bad duration', async () => {
    const r = await svc.createPip({ employeeId: 1, createdBy: 2, durationDays: 3 });
    expect(r.ok).toBe(false);
    expect(repo.createPip).not.toHaveBeenCalled();
  });

  it('createPip: happy path emits PIP_STARTED', async () => {
    repo.createPip.mockResolvedValueOnce(Ok({ id: 100, employee_id: 5 }));
    const r = await svc.createPip({ employeeId: 5, createdBy: 9, durationDays: 30 });
    expect(r.ok).toBe(true);
    expect(emitter.emit).toHaveBeenCalledWith('pip.started', expect.objectContaining({ pipId: 100, employeeId: 5 }));
  });

  it('addProgressUpdate: pip missing → NOT_FOUND', async () => {
    repo.getPip.mockResolvedValueOnce(Ok(null));
    const r = await svc.addProgressUpdate(1, { updatedBy: 2, notes: 'x' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('addProgressUpdate: cannot update completed pip', async () => {
    repo.getPip.mockResolvedValueOnce(Ok({ id: 1, status: 'completed', employee_id: 9 }));
    const r = await svc.addProgressUpdate(1, { updatedBy: 2, notes: 'x' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INVALID_TRANSITION');
  });

  it('addProgressUpdate: status=completed → markCompleted + PIP_COMPLETED event', async () => {
    repo.getPip.mockResolvedValueOnce(Ok({ id: 1, status: 'active', employee_id: 9 }));
    repo.addProgressUpdate.mockResolvedValueOnce(Ok({ id: 50 }));
    const r = await svc.addProgressUpdate(1, { updatedBy: 2, notes: 'done', status: 'completed' });
    expect(r.ok).toBe(true);
    expect(repo.markCompleted).toHaveBeenCalledWith(1);
    expect(emitter.emit).toHaveBeenCalledWith('pip.completed', expect.objectContaining({ pipId: 1 }));
  });

  it('addProgressUpdate: status=failed → markFailed + PIP_FAILED event', async () => {
    repo.getPip.mockResolvedValueOnce(Ok({ id: 1, status: 'active', employee_id: 9 }));
    repo.addProgressUpdate.mockResolvedValueOnce(Ok({ id: 51 }));
    const r = await svc.addProgressUpdate(1, { updatedBy: 2, notes: 'no good', status: 'failed' });
    expect(r.ok).toBe(true);
    expect(repo.markFailed).toHaveBeenCalledWith(1);
    expect(emitter.emit).toHaveBeenCalledWith('pip.failed', expect.objectContaining({ pipId: 1 }));
  });

  it('addProgressUpdate: on_track does not change plan status', async () => {
    repo.getPip.mockResolvedValueOnce(Ok({ id: 1, status: 'active', employee_id: 9 }));
    repo.addProgressUpdate.mockResolvedValueOnce(Ok({ id: 52 }));
    const r = await svc.addProgressUpdate(1, { updatedBy: 2, notes: 'ok', status: 'on_track' });
    expect(r.ok).toBe(true);
    expect(repo.markCompleted).not.toHaveBeenCalled();
    expect(repo.markFailed).not.toHaveBeenCalled();
  });

  it('cancelPip: not found → NOT_FOUND', async () => {
    repo.getPip.mockResolvedValueOnce(Ok(null));
    const r = await svc.cancelPip(1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('cancelPip: completed → INVALID_TRANSITION', async () => {
    repo.getPip.mockResolvedValueOnce(Ok({ id: 1, status: 'completed', employee_id: 9 }));
    const r = await svc.cancelPip(1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INVALID_TRANSITION');
  });

  it('cancelPip: active → repo.cancel called', async () => {
    repo.getPip.mockResolvedValueOnce(Ok({ id: 1, status: 'active', employee_id: 9 }));
    repo.cancel.mockResolvedValueOnce(Ok({ id: 1, status: 'cancelled' }));
    const r = await svc.cancelPip(1, 'manager request');
    expect(r.ok).toBe(true);
    expect(repo.cancel).toHaveBeenCalledWith(1);
  });

  it('extendPip: bad extraDays → VALIDATION', async () => {
    const r = await svc.extendPip(1, 0);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('extendPip: extraDays > 90 → VALIDATION', async () => {
    const r = await svc.extendPip(1, 120);
    expect(r.ok).toBe(false);
  });

  it('extendPip: completed → INVALID_TRANSITION', async () => {
    repo.getPip.mockResolvedValueOnce(Ok({ id: 1, status: 'completed', end_date: '2026-02-01' }));
    const r = await svc.extendPip(1, 7);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INVALID_TRANSITION');
  });

  it('extendPip: active → updateEndDate called with computed date', async () => {
    repo.getPip.mockResolvedValueOnce(Ok({ id: 1, status: 'active', end_date: '2026-02-01' }));
    repo.updateEndDate.mockResolvedValueOnce(Ok({ id: 1, end_date: '2026-02-08' }));
    const r = await svc.extendPip(1, 7);
    expect(r.ok).toBe(true);
    expect(repo.updateEndDate).toHaveBeenCalledWith(1, '2026-02-08');
  });
});
