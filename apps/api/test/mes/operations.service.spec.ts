/**
 * test/mes/operations.service.spec.ts
 *
 * OperationsService is a thin layer over OperationsRepository, but
 * createDowntimeEvent contains real branching logic: it looks up the
 * production session first and refuses to create a downtime event when
 * the session does not exist (wrapped in safeCall, so the NotFoundException
 * surfaces as a Result error rather than a thrown exception).
 */

import { OperationsService } from '../../src/modules/mes/operations/operations.service';
import { OperationsRepository } from '../../src/modules/mes/operations/operations.repository';
import { Ok, Err } from '../../src/common/result';

function buildRepo(overrides: Partial<jest.Mocked<OperationsRepository>> = {}): jest.Mocked<OperationsRepository> {
  return {
    findDowntimeEvents: jest.fn().mockResolvedValue(Ok([])),
    findSession: jest.fn().mockResolvedValue(Ok([{ id: 1 }])),
    createDowntimeEvent: jest.fn().mockResolvedValue(Ok({ id: 5 })),
    findReasonCodes: jest.fn().mockResolvedValue(Ok([])),
    ...overrides,
  } as unknown as jest.Mocked<OperationsRepository>;
}

describe('OperationsService.createDowntimeEvent', () => {
  it('creates the downtime event when the referenced session exists', async () => {
    const repo = buildRepo({
      findSession: jest.fn().mockResolvedValue(Ok([{ id: 7 }])),
      createDowntimeEvent: jest.fn().mockResolvedValue(Ok({ id: 42, sessionId: '7' })),
    });
    const svc = new OperationsService(repo);

    const result = await svc.createDowntimeEvent({ sessionId: '7', reasonCode: 'JAM' });

    expect(repo.findSession).toHaveBeenCalledWith(7);
    expect(repo.createDowntimeEvent).toHaveBeenCalledWith({ sessionId: '7', reasonCode: 'JAM' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ id: 42, sessionId: '7' });
    }
  });

  it('returns a NOT_FOUND result and does not create the event when the session is missing', async () => {
    const repo = buildRepo({
      findSession: jest.fn().mockResolvedValue(Ok([])),
    });
    const svc = new OperationsService(repo);

    const result = await svc.createDowntimeEvent({ sessionId: '999' });

    expect(repo.findSession).toHaveBeenCalledWith(999);
    expect(repo.createDowntimeEvent).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toContain('999');
    }
  });

  it('treats a failed session lookup the same as a missing session', async () => {
    const repo = buildRepo({
      findSession: jest.fn().mockResolvedValue(Err('db down')),
    });
    const svc = new OperationsService(repo);

    const result = await svc.createDowntimeEvent({ sessionId: '3' });

    expect(repo.createDowntimeEvent).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });
});

describe('OperationsService — passthroughs', () => {
  it('getDowntimeEvents forwards the session id to the repository', async () => {
    const repo = buildRepo({ findDowntimeEvents: jest.fn().mockResolvedValue(Ok([{ id: 1 }])) });
    const svc = new OperationsService(repo);

    const result = await svc.getDowntimeEvents('12');

    expect(repo.findDowntimeEvents).toHaveBeenCalledWith('12');
    expect(result).toEqual(Ok([{ id: 1 }]));
  });

  it('getReasonCodes forwards straight to the repository', async () => {
    const reasonCodes = [{ id: 1, code: 'JAM' }];
    const repo = buildRepo({ findReasonCodes: jest.fn().mockResolvedValue(Ok(reasonCodes)) });
    const svc = new OperationsService(repo);

    const result = await svc.getReasonCodes();

    expect(repo.findReasonCodes).toHaveBeenCalled();
    expect(result).toEqual(Ok(reasonCodes));
  });
});
