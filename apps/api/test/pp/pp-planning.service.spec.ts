/**
 * test/pp/pp-planning.service.spec.ts
 *
 * PpPlanningService — passthrough over PpPlanningRepository.
 * Wraps repository errors with safeCall so service always returns Result<T>.
 */

import { PpPlanningService } from '../../src/modules/pp/application/pp-planning.service';
import { PpPlanningRepository } from '../../src/modules/pp/application/pp-planning.repository';

function buildRepo(overrides: Partial<jest.Mocked<PpPlanningRepository>> = {}): jest.Mocked<PpPlanningRepository> {
  return {
    getSchedule: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    createScheduleEntry: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    updateOperation: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    ...overrides,
  } as unknown as jest.Mocked<PpPlanningRepository>;
}

describe('PpPlanningService', () => {
  it('getSchedule passes start and end dates through to the repository', async () => {
    const repo = buildRepo({
      getSchedule: jest.fn().mockResolvedValue({
        ok: true,
        data: [{ id: 1, orderNumber: 'PO-1' }],
      }),
    });
    const svc = new PpPlanningService(repo);

    const r = await svc.getSchedule('2026-01-01', '2026-01-31');

    expect(repo.getSchedule).toHaveBeenCalledWith('2026-01-01', '2026-01-31');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // safeCall returns the repo's Result wrapper inside r.data
    expect(r.data).toEqual({ ok: true, data: [{ id: 1, orderNumber: 'PO-1' }] });
  });

  it('createScheduleEntry returns the created production order row', async () => {
    const repo = buildRepo({
      createScheduleEntry: jest.fn().mockResolvedValue({
        ok: true,
        data: { id: 11, productId: 7, quantity: 100 },
      }),
    });
    const svc = new PpPlanningService(repo);

    const r = await svc.createScheduleEntry({ productId: 7, quantity: 100 });

    expect(repo.createScheduleEntry).toHaveBeenCalledWith({ productId: 7, quantity: 100 }, undefined);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const inner = r.data as { ok: boolean; data: { id: number } };
    expect(inner.data.id).toBe(11);
  });

  // B14 (2026-07-05): production_orders.created_by existed but was never written from
  // this live, @CurrentUser()-driven HTTP path (POST /planning/schedule).
  it('passes createdBy through to the repository', async () => {
    const repo = buildRepo({
      createScheduleEntry: jest.fn().mockResolvedValue({ ok: true, data: { id: 11 } }),
    });
    const svc = new PpPlanningService(repo);

    await svc.createScheduleEntry({ productId: 7, quantity: 100 }, 42);

    expect(repo.createScheduleEntry).toHaveBeenCalledWith({ productId: 7, quantity: 100 }, 42);
  });

  it('updateOperation forwards id and patch payload', async () => {
    const repo = buildRepo({
      updateOperation: jest.fn().mockResolvedValue({ ok: true, data: { id: 5, status: 'done' } }),
    });
    const svc = new PpPlanningService(repo);

    const r = await svc.updateOperation(5, { status: 'done' });

    expect(repo.updateOperation).toHaveBeenCalledWith(5, { status: 'done' });
    expect(r.ok).toBe(true);
  });

  it('converts repository rejections into Err results via safeCall', async () => {
    const repo = buildRepo({
      getSchedule: jest.fn().mockRejectedValue(new Error('db unreachable')),
    });
    const svc = new PpPlanningService(repo);

    const r = await svc.getSchedule('2026-01-01', '2026-01-31');

    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.message).toContain('db unreachable');
  });

  it('forwards an empty schedule list without modification', async () => {
    const repo = buildRepo({
      getSchedule: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    });
    const svc = new PpPlanningService(repo);

    const r = await svc.getSchedule('2026-02-01', '2026-02-28');

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const inner = r.data as { ok: boolean; data: unknown[] };
    expect(inner.data).toEqual([]);
  });
});
