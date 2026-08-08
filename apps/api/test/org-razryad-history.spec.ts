/**
 * org-razryad-history.spec.ts — EP-ORG-010..013/091 razryad o'sish/pasayish biznes-logikasi.
 *
 * Covers RazryadHistoryService.createRequest() validation rules (increase requires a
 * higher target level + exam threshold + 3-month interval guard; decrease requires a
 * lower target level + mandatory reason), plus the 2-signature approval flow
 * (hrApprove → managerApprove) and reject(). All repo calls are mocked (Q-31/behavioral
 * style, mirrors org-razryad-crud.spec.ts) — no live DB.
 */

import { RazryadHistoryService } from '../src/modules/org-structure/razryad-history.service';
import type { RazryadHistoryRepository } from '../src/modules/org-structure/razryad-history.repository';
import { Ok, isOk, isErr } from '../src/common/result';

type Row = Record<string, unknown>;

function makeRepo(over: Partial<Record<keyof RazryadHistoryRepository, jest.Mock>> = {}): RazryadHistoryRepository {
  return {
    historyByCard: jest.fn().mockResolvedValue(Ok([])),
    listRequestsByCard: jest.fn().mockResolvedValue(Ok([])),
    listPendingRequests: jest.fn().mockResolvedValue(Ok([])),
    cardRazryad: jest.fn().mockResolvedValue(Ok({ razryadLevelId: 1 })),
    razryadLevel: jest.fn().mockResolvedValue(Ok({ id: 1, level: 1 })),
    cardOccupant: jest.fn().mockResolvedValue(Ok(null)),
    createRequest: jest.fn().mockResolvedValue(Ok({ id: 1 })),
    findRequest: jest.fn().mockResolvedValue(Ok(null)),
    cardIdForExam: jest.fn().mockResolvedValue(Ok(null)),
    primaryCardForUser: jest.fn().mockResolvedValue(Ok(null)),
    nextRazryadIdForCard: jest.fn().mockResolvedValue(Ok(null)),
    lastChangeAt: jest.fn().mockResolvedValue(Ok(null)),
    markHrApproved: jest.fn().mockResolvedValue(Ok({ id: 1, status: 'hr_approved' })),
    markRejected: jest.fn().mockResolvedValue(Ok({ id: 1, status: 'rejected' })),
    applyChange: jest.fn().mockResolvedValue(Ok({ id: 1 } as Row)),
    ...over,
  } as unknown as RazryadHistoryRepository;
}

/** Convenience: current razryad level=2, target level=3, both found. */
function repoWithLevels(overrides: { current?: Row | null; target?: Row | null } = {}, extra: Partial<Record<keyof RazryadHistoryRepository, jest.Mock>> = {}) {
  const current = overrides.current === undefined ? { id: 10, level: 2 } : overrides.current;
  const target = overrides.target === undefined ? { id: 20, level: 3, exam_pass_threshold: 70, min_months: 3 } : overrides.target;
  return makeRepo({
    cardRazryad: jest.fn().mockResolvedValue(Ok({ razryadLevelId: current ? 10 : null })),
    razryadLevel: jest.fn((id: number) => {
      if (id === 20) return Promise.resolve(Ok(target));
      if (id === 10) return Promise.resolve(Ok(current));
      return Promise.resolve(Ok(null));
    }),
    ...extra,
  });
}

describe('RazryadHistoryService.createRequest — increase', () => {
  it('rejects increase when target level is not higher than current level', async () => {
    const repo = repoWithLevels({ current: { id: 10, level: 3 }, target: { id: 20, level: 2, exam_pass_threshold: 70, min_months: 0 } });
    const svc = new RazryadHistoryService(repo);
    const r = await svc.createRequest({ cardId: 1, targetRazryadId: 20, requestType: 'increase' });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe('VALIDATION');
  });

  it('rejects increase when exam_pass_threshold is not configured (NULL -> no fabrication)', async () => {
    const repo = repoWithLevels({ target: { id: 20, level: 3, exam_pass_threshold: null, min_months: 0 } });
    const svc = new RazryadHistoryService(repo);
    const r = await svc.createRequest({ cardId: 1, targetRazryadId: 20, requestType: 'increase', examScore: 90 });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) {
      expect(r.error.code).toBe('VALIDATION');
      expect(r.error.message).toMatch(/imtihon o'tish-chegarasi/i);
    }
  });

  it('rejects increase when no exam score is supplied', async () => {
    const repo = repoWithLevels();
    const svc = new RazryadHistoryService(repo);
    const r = await svc.createRequest({ cardId: 1, targetRazryadId: 20, requestType: 'increase' });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.message).toMatch(/imtihon bali kerak/i);
  });

  it('rejects increase when exam score is below the configured threshold', async () => {
    const repo = repoWithLevels();
    const svc = new RazryadHistoryService(repo);
    const r = await svc.createRequest({ cardId: 1, targetRazryadId: 20, requestType: 'increase', examScore: 50 });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.message).toMatch(/o'tish-chegarasidan.*past/i);
  });

  it('rejects increase when min_months guard is not configured (NULL -> no fabrication)', async () => {
    const repo = repoWithLevels({ target: { id: 20, level: 3, exam_pass_threshold: 70, min_months: null } });
    const svc = new RazryadHistoryService(repo);
    const r = await svc.createRequest({ cardId: 1, targetRazryadId: 20, requestType: 'increase', examScore: 90 });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.message).toMatch(/minimal oraliq/i);
  });

  it('rejects increase when the 3-month interval since the last change has not elapsed', async () => {
    const oneMonthAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const repo = repoWithLevels({}, { lastChangeAt: jest.fn().mockResolvedValue(Ok(oneMonthAgo)) });
    const svc = new RazryadHistoryService(repo);
    const r = await svc.createRequest({ cardId: 1, targetRazryadId: 20, requestType: 'increase', examScore: 90 });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.message).toMatch(/oy o'tishi kerak/i);
  });

  it('accepts a valid increase request (higher level + passing score + interval elapsed)', async () => {
    const fourMonthsAgo = new Date(Date.now() - 4 * 30.44 * 24 * 60 * 60 * 1000);
    const createRequest = jest.fn().mockResolvedValue(Ok({ id: 42, status: 'pending' }));
    const repo = repoWithLevels({}, { lastChangeAt: jest.fn().mockResolvedValue(Ok(fourMonthsAgo)), createRequest });
    const svc = new RazryadHistoryService(repo);
    const r = await svc.createRequest({ cardId: 1, targetRazryadId: 20, requestType: 'increase', examScore: 90 });
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect((r.data as Row).id).toBe(42);
    expect(createRequest).toHaveBeenCalled();
  });

  it('skips the interval guard entirely when min_months <= 0', async () => {
    const repo = repoWithLevels({ target: { id: 20, level: 3, exam_pass_threshold: 70, min_months: 0 } });
    const svc = new RazryadHistoryService(repo);
    const r = await svc.createRequest({ cardId: 1, targetRazryadId: 20, requestType: 'increase', examScore: 90 });
    expect(isOk(r)).toBe(true);
    expect(repo.lastChangeAt).not.toHaveBeenCalled();
  });
});

describe('RazryadHistoryService.createRequest — decrease', () => {
  it('rejects decrease without a reason', async () => {
    const repo = repoWithLevels();
    const svc = new RazryadHistoryService(repo);
    const r = await svc.createRequest({ cardId: 1, targetRazryadId: 20, requestType: 'decrease' });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.message).toMatch(/sabab majburiy/i);
  });

  it('rejects decrease when target level is not lower than current level', async () => {
    const repo = repoWithLevels({ current: { id: 10, level: 2 }, target: { id: 20, level: 3, exam_pass_threshold: 70, min_months: 0 } });
    const svc = new RazryadHistoryService(repo);
    const r = await svc.createRequest({ cardId: 1, targetRazryadId: 20, requestType: 'decrease', reason: 'intizom buzilishi' });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.message).toMatch(/past bo'lishi kerak/i);
  });

  it('accepts a valid decrease request (lower level + reason supplied, no exam/interval guard)', async () => {
    const createRequest = jest.fn().mockResolvedValue(Ok({ id: 7, status: 'pending' }));
    const repo = repoWithLevels({ current: { id: 10, level: 3 }, target: { id: 20, level: 2, exam_pass_threshold: 70, min_months: 3 } }, { createRequest });
    const svc = new RazryadHistoryService(repo);
    const r = await svc.createRequest({ cardId: 1, targetRazryadId: 20, requestType: 'decrease', reason: 'intizom buzilishi' });
    expect(isOk(r)).toBe(true);
    expect(repo.lastChangeAt).not.toHaveBeenCalled();
    if (isOk(r)) expect((r.data as Row).id).toBe(7);
  });
});

describe('RazryadHistoryService.createRequest — not-found guards', () => {
  it('returns NOT_FOUND when the card has no razryad row', async () => {
    const repo = makeRepo({ cardRazryad: jest.fn().mockResolvedValue(Ok(null)) });
    const svc = new RazryadHistoryService(repo);
    const r = await svc.createRequest({ cardId: 999, targetRazryadId: 20, requestType: 'increase', examScore: 90 });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns NOT_FOUND when the target razryad level does not exist', async () => {
    const repo = makeRepo({
      cardRazryad: jest.fn().mockResolvedValue(Ok({ razryadLevelId: 10 })),
      razryadLevel: jest.fn().mockResolvedValue(Ok(null)),
    });
    const svc = new RazryadHistoryService(repo);
    const r = await svc.createRequest({ cardId: 1, targetRazryadId: 999, requestType: 'increase', examScore: 90 });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe('NOT_FOUND');
  });
});

describe('RazryadHistoryService — approval flow (2-imzo)', () => {
  it('hrApprove → VALIDATION when the request is missing or already reviewed', async () => {
    const repo = makeRepo({ markHrApproved: jest.fn().mockResolvedValue(Ok(null)) });
    const svc = new RazryadHistoryService(repo);
    const r = await svc.hrApprove(999, 5);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe('VALIDATION');
  });

  it('hrApprove → Ok with the updated row when found', async () => {
    const repo = makeRepo({ markHrApproved: jest.fn().mockResolvedValue(Ok({ id: 1, status: 'hr_approved' })) });
    const svc = new RazryadHistoryService(repo);
    const r = await svc.hrApprove(1, 5);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect((r.data as Row).status).toBe('hr_approved');
  });

  it('managerApprove → NOT_FOUND when the request does not exist', async () => {
    const repo = makeRepo({ findRequest: jest.fn().mockResolvedValue(Ok(null)) });
    const svc = new RazryadHistoryService(repo);
    const r = await svc.managerApprove(999, 7);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('managerApprove → VALIDATION when the request has not been HR-approved yet (still pending)', async () => {
    const repo = makeRepo({
      findRequest: jest.fn().mockResolvedValue(Ok({ id: 1, status: 'pending', card_id: 1, target_razryad_id: 20 })),
    });
    const svc = new RazryadHistoryService(repo);
    const r = await svc.managerApprove(1, 7);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) {
      expect(r.error.code).toBe('VALIDATION');
      expect(r.error.message).toMatch(/HR tomonidan tasdiqlanishi kerak/i);
    }
    expect(repo.applyChange).not.toHaveBeenCalled();
  });

  it('managerApprove → applies the change atomically once HR-approved, generating a certificate number', async () => {
    const applyChange = jest.fn().mockResolvedValue(Ok({ id: 55, certificate_number: 'CERT-RZ-1-123' } as Row));
    const repo = makeRepo({
      findRequest: jest.fn().mockResolvedValue(Ok({
        id: 1, status: 'hr_approved', card_id: 1, target_razryad_id: 20, current_razryad_id: 10,
        request_type: 'increase', employee_id: 3, reason: null, exam_score: 90,
        requested_by: 2, hr_approved_by: 5,
      })),
      applyChange,
    });
    const svc = new RazryadHistoryService(repo);
    const r = await svc.managerApprove(1, 7);
    expect(isOk(r)).toBe(true);
    expect(applyChange).toHaveBeenCalledTimes(1);
    const [applyInput, requestId] = applyChange.mock.calls[0];
    expect(requestId).toBe(1);
    expect(applyInput.cardId).toBe(1);
    expect(applyInput.newRazryadId).toBe(20);
    expect(applyInput.oldRazryadId).toBe(10);
    expect(applyInput.changeType).toBe('increase');
    expect(applyInput.managerApprovedBy).toBe(7);
    expect(applyInput.certificateNumber).toMatch(/^CERT-RZ-1-\d+$/);
  });
});

describe('RazryadHistoryService.reject', () => {
  it('rejects without a reason', async () => {
    const svc = new RazryadHistoryService(makeRepo());
    const r = await svc.reject(1, 5, '');
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe('VALIDATION');
  });

  it('returns VALIDATION when the request is not found or already closed', async () => {
    const repo = makeRepo({ markRejected: jest.fn().mockResolvedValue(Ok(null)) });
    const svc = new RazryadHistoryService(repo);
    const r = await svc.reject(999, 5, 'sabab');
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe('VALIDATION');
  });

  it('marks the request rejected with the given reason', async () => {
    const markRejected = jest.fn().mockResolvedValue(Ok({ id: 1, status: 'rejected', reject_reason: 'sabab' }));
    const svc = new RazryadHistoryService(makeRepo({ markRejected }));
    const r = await svc.reject(1, 5, 'sabab');
    expect(isOk(r)).toBe(true);
    expect(markRejected).toHaveBeenCalledWith(1, 5, 'sabab');
  });
});
