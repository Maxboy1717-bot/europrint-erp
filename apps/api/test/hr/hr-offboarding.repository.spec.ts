/**
 * Unit tests for HrOffboardingRepository.
 * Covers updateChecklistItem, recordExitInterview, finalizeCase, findCaseById.
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
  offboarding_cases: { id: 'oc.id', status: 'oc.status', updated_at: 'oc.updated_at' },
  offboarding_checklist_items: { id: 'oci.id', case_id: 'oci.case_id', done: 'oci.done' },
}));

import { HrOffboardingRepository } from '../../src/modules/hr/offboarding/hr-offboarding.repository';

describe('HrOffboardingRepository', () => {
  let repo: HrOffboardingRepository;
  beforeEach(() => {
    repo = new HrOffboardingRepository();
    dbStub.__setResolved([]);
  });

  describe('updateChecklistItem', () => {
    it('returns Ok with updated row when match', async () => {
      dbStub.__setResolved([{ id: 1, done: true }]);
      const r = await repo.updateChecklistItem(5, 1, true);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, done: true });
    });

    it('returns Ok with empty object when no row matched', async () => {
      dbStub.__setResolved([]);
      const r = await repo.updateChecklistItem(5, 999, false);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.updateChecklistItem(5, 1, true);
      expect(r.ok).toBe(false);
    });
  });

  describe('recordExitInterview', () => {
    // 2026-07-13 fix: signature changed from (caseId, notesString) to
    // (caseId, { notes, reason, blocksSettlement }) — the old version computed
    // `exit_interview_notes` but never persisted it (fake success, Q-40); now
    // it's a real column write, so the row returned by the DB (mocked here)
    // reflects whatever the mock resolves with, not the input notes string.
    it('returns Ok with the updated row when update succeeds', async () => {
      dbStub.__setResolved([{ id: 1, status: 'exit_interviewed', exit_interview_notes: 'Constructive feedback' }]);
      const r = await repo.recordExitInterview(1, { notes: 'Constructive feedback', reason: 'Career', blocksSettlement: false });
      expect(r.ok).toBe(true);
      if (r.ok) expect((r.data as { exit_interview_notes: string }).exit_interview_notes).toBe('Constructive feedback');
    });

    it('returns Ok with empty object when no row updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.recordExitInterview(99, { notes: 'note', reason: 'Javob bermadi', blocksSettlement: false });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.recordExitInterview(1, { notes: 'note', reason: 'Javob bermadi', blocksSettlement: false });
      expect(r.ok).toBe(false);
    });
  });

  describe('finalizeCase', () => {
    it('returns Ok with completed row when finalization succeeds', async () => {
      dbStub.__setResolved([{ id: 1, status: 'completed' }]);
      const r = await repo.finalizeCase(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'completed' });
    });

    it('returns Ok with empty object when nothing updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.finalizeCase(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.finalizeCase(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('findCaseById', () => {
    it('returns Ok with case row when found', async () => {
      dbStub.__setResolved([{ id: 1, status: 'active' }]);
      const r = await repo.findCaseById(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'active' });
    });

    it('returns Ok with null when not found', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findCaseById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.findCaseById(1);
      expect(r.ok).toBe(false);
    });
  });
});
