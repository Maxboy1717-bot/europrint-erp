/**
 * pip.complete.spec.ts — Phase 4 Task 4.2
 *
 * Adds the PATCH /api/hr-v2/pip/:id/complete endpoint that `PIPPage.tsx:68`
 * relies on. Tests the new service method end-to-end (mocked repo + event bus).
 */

import { NotFoundException } from '@nestjs/common';
import { PipService } from '../../src/modules/hr/pip/pip.service';
import { HrV2Events } from '../../src/modules/hr/events/hr-v2-events';

describe('PipService.completePip — Phase 4 Task 4.2', () => {
  let svc: PipService;
  let mockRepo: {
    getPip: jest.Mock;
    markCompleted: jest.Mock;
    markFailed: jest.Mock;
  };
  let mockEmitter: { emit: jest.Mock };

  beforeEach(() => {
    mockRepo = {
      getPip: jest.fn(),
      markCompleted: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
    };
    mockEmitter = { emit: jest.fn() };
    svc = new PipService(mockEmitter as never, mockRepo as never);
  });

  it('marks plan completed (PASSED) and emits PIP_COMPLETED', async () => {
    mockRepo.getPip
      .mockResolvedValueOnce({ ok: true, data: { id: 7, employee_id: 42 } })
      .mockResolvedValueOnce({ ok: true, data: { id: 7, employee_id: 42, status: 'completed', outcome: 'PASSED' } });

    const r = await svc.completePip(7, 'PASSED');

    expect(mockRepo.markCompleted).toHaveBeenCalledWith(7);
    expect(mockRepo.markFailed).not.toHaveBeenCalled();
    expect(mockEmitter.emit).toHaveBeenCalledWith(HrV2Events.PIP_COMPLETED, {
      pipId: 7, employeeId: 42, outcome: 'PASSED', source: 'manual_complete',
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.data as { outcome: string }).outcome).toBe('PASSED');
  });

  it('marks plan failed and emits PIP_FAILED', async () => {
    mockRepo.getPip
      .mockResolvedValueOnce({ ok: true, data: { id: 8, employee_id: 99 } })
      .mockResolvedValueOnce({ ok: true, data: { id: 8, employee_id: 99, status: 'failed', outcome: 'FAILED' } });

    const r = await svc.completePip(8, 'FAILED');

    expect(mockRepo.markFailed).toHaveBeenCalledWith(8);
    expect(mockRepo.markCompleted).not.toHaveBeenCalled();
    expect(mockEmitter.emit).toHaveBeenCalledWith(HrV2Events.PIP_FAILED, {
      pipId: 8, employeeId: 99, outcome: 'FAILED', source: 'manual_complete',
    });
    expect(r.ok).toBe(true);
  });

  it('returns Result-err (NotFound) when pip does not exist', async () => {
    mockRepo.getPip.mockResolvedValueOnce({ ok: true, data: null });

    const r = await svc.completePip(404, 'PASSED');

    expect(r.ok).toBe(false);
    expect(mockRepo.markCompleted).not.toHaveBeenCalled();
    expect(mockEmitter.emit).not.toHaveBeenCalled();
  });

  it('returns Result-err when repository returns ok:false', async () => {
    mockRepo.getPip.mockResolvedValueOnce({ ok: false, error: { code: 'DB_ERROR', message: 'connection lost' } });

    const r = await svc.completePip(5, 'PASSED');

    expect(r.ok).toBe(false);
    expect(mockRepo.markCompleted).not.toHaveBeenCalled();
  });

  it('falls back to {id, outcome} when post-update getPip fails', async () => {
    mockRepo.getPip
      .mockResolvedValueOnce({ ok: true, data: { id: 9, employee_id: 1 } })
      .mockResolvedValueOnce({ ok: false, error: { code: 'DB_ERROR', message: 'read failed' } });

    const r = await svc.completePip(9, 'PASSED');

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual({ id: 9, outcome: 'PASSED' });
  });

  it('NotFoundException thrown inside safeCall is captured into Result', async () => {
    mockRepo.getPip.mockImplementationOnce(() => { throw new NotFoundException('boom'); });
    const r = await svc.completePip(1, 'PASSED');
    expect(r.ok).toBe(false);
  });
});
