/**
 * test/pp/pp-planning.service.spec.ts
 *
 * PpPlanningService — passthrough over PpPlanningRepository.
 * Wraps repository errors with safeCall so service always returns Result<T>.
 */

import { EventBus } from '@nestjs/cqrs';
import { PpPlanningService } from '../../src/modules/pp/application/pp-planning.service';
import { PpPlanningRepository } from '../../src/modules/pp/application/pp-planning.repository';
import { PpCancelledEvent } from '../../src/modules/pp/domain/events/pp-cancelled.event';

function buildRepo(overrides: Partial<jest.Mocked<PpPlanningRepository>> = {}): jest.Mocked<PpPlanningRepository> {
  return {
    getSchedule: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    createScheduleEntry: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    updateOperation: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    ...overrides,
  } as unknown as jest.Mocked<PpPlanningRepository>;
}

function makeEventBus(): jest.Mocked<EventBus> {
  return { publish: jest.fn() } as unknown as jest.Mocked<EventBus>;
}

describe('PpPlanningService', () => {
  it('getSchedule passes start and end dates through to the repository', async () => {
    const repo = buildRepo({
      getSchedule: jest.fn().mockResolvedValue({
        ok: true,
        data: [{ id: 1, orderNumber: 'PO-1' }],
      }),
    });
    const svc = new PpPlanningService(repo, makeEventBus());

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
    const svc = new PpPlanningService(repo, makeEventBus());

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
    const svc = new PpPlanningService(repo, makeEventBus());

    await svc.createScheduleEntry({ productId: 7, quantity: 100 }, 42);

    expect(repo.createScheduleEntry).toHaveBeenCalledWith({ productId: 7, quantity: 100 }, 42);
  });

  it('updateOperation forwards id and patch payload', async () => {
    const repo = buildRepo({
      updateOperation: jest.fn().mockResolvedValue({ ok: true, data: { id: 5, status: 'done' } }),
    });
    const svc = new PpPlanningService(repo, makeEventBus());

    const r = await svc.updateOperation(5, { status: 'done' });

    expect(repo.updateOperation).toHaveBeenCalledWith(5, { status: 'done' });
    expect(r.ok).toBe(true);
  });

  it('converts repository rejections into Err results via safeCall', async () => {
    const repo = buildRepo({
      getSchedule: jest.fn().mockRejectedValue(new Error('db unreachable')),
    });
    const svc = new PpPlanningService(repo, makeEventBus());

    const r = await svc.getSchedule('2026-01-01', '2026-01-31');

    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.message).toContain('db unreachable');
  });

  it('forwards an empty schedule list without modification', async () => {
    const repo = buildRepo({
      getSchedule: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    });
    const svc = new PpPlanningService(repo, makeEventBus());

    const r = await svc.getSchedule('2026-02-01', '2026-02-28');

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const inner = r.data as { ok: boolean; data: unknown[] };
    expect(inner.data).toEqual([]);
  });

  // Golden-thread gap fix: cancelling a planning operation must notify SD via
  // PpCancelledEvent so the linked sales order can be put on hold.
  describe('updateOperation — cancellation publishes PpCancelledEvent', () => {
    it('publishes PpCancelledEvent with poId + sales_order_id when status becomes cancelled', async () => {
      const repo = buildRepo({
        updateOperation: jest.fn().mockResolvedValue({
          ok: true,
          data: { id: 5, status: 'cancelled', sales_order_id: 56 },
        }),
      });
      const bus = makeEventBus();
      const svc = new PpPlanningService(repo, bus);

      const r = await svc.updateOperation(5, { status: 'cancelled' });

      expect(r.ok).toBe(true);
      expect(bus.publish).toHaveBeenCalledTimes(1);
      expect(bus.publish).toHaveBeenCalledWith(expect.any(PpCancelledEvent));
      const published = bus.publish.mock.calls[0][0] as PpCancelledEvent;
      expect(published.poId).toBe(5);
      expect(published.salesOrderId).toBe(56);
    });

    it('does NOT publish when status is cancelled but sales_order_id is null (no linked SO)', async () => {
      const repo = buildRepo({
        updateOperation: jest.fn().mockResolvedValue({
          ok: true,
          data: { id: 6, status: 'cancelled', sales_order_id: null },
        }),
      });
      const bus = makeEventBus();
      const svc = new PpPlanningService(repo, bus);

      const r = await svc.updateOperation(6, { status: 'cancelled' });

      expect(r.ok).toBe(true);
      expect(bus.publish).not.toHaveBeenCalled();
    });

    it('does NOT publish when the status patch is not "cancelled"', async () => {
      const repo = buildRepo({
        updateOperation: jest.fn().mockResolvedValue({
          ok: true,
          data: { id: 7, status: 'in_progress', sales_order_id: 56 },
        }),
      });
      const bus = makeEventBus();
      const svc = new PpPlanningService(repo, bus);

      await svc.updateOperation(7, { status: 'in_progress' });

      expect(bus.publish).not.toHaveBeenCalled();
    });

    it('does NOT publish when the repository update fails', async () => {
      const repo = buildRepo({
        updateOperation: jest.fn().mockResolvedValue({ ok: false, error: { code: 'DB_ERROR', message: 'boom' } }),
      });
      const bus = makeEventBus();
      const svc = new PpPlanningService(repo, bus);

      await svc.updateOperation(8, { status: 'cancelled' });

      expect(bus.publish).not.toHaveBeenCalled();
    });
  });
});
