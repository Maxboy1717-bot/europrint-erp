/**
 * test/pp/pp-mps.service.spec.ts
 *
 * PpMpsService.getMps — builds the Master Production Schedule by combining
 * mps_periods (with a production_orders fallback), on-hand stock and
 * committed demand, then delegates the per-period ATP math to the real
 * MpsAtpHandler (pure calculation, not mocked — see mps-atp.handler.spec.ts).
 */

jest.mock('@shared/db', () => ({ runQuery: jest.fn() }));

import { PpMpsService } from '../../src/modules/pp/application/services/pp-mps.service';
import { MpsAtpHandler } from '../../src/modules/pp/application/queries/mps-atp.handler';
import { runQuery } from '@shared/db';

const mockRun = runQuery as jest.Mock;

describe('PpMpsService.getMps', () => {
  let svc: PpMpsService;

  beforeEach(() => {
    mockRun.mockReset();
    svc = new PpMpsService(new MpsAtpHandler());
  });

  it('computes real cumulative ATP per period from mps_periods, on-hand and committed demand', async () => {
    // Call order inside getMps: loadRows (mps_periods hit, no fallback) → loadOnHand → loadCommittedDemand.
    mockRun
      .mockResolvedValueOnce({
        rows: [
          { product_id: 'P1', period: 'Hafta 1', quantity: '100', due_date: '2026-01-05', source: 'manual', week_num: 1 },
          { product_id: 'P1', period: 'Hafta 2', quantity: '50', due_date: '2026-01-12', source: 'manual', week_num: 2 },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ product_id: 'P1', on_hand: '20' }] })
      .mockResolvedValueOnce({ rows: [{ product_id: 'P1', qty: '60', week_num: 1 }] });

    const r = await svc.getMps();

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toHaveLength(2);

    // period 0: cumMps = onHand(20) + 100 = 120, cumCo = 60 → atp = 60
    expect(r.data[0]).toMatchObject({
      productId: 'P1',
      quantity: 100,
      dueDate: '2026-01-05',
      source: 'manual',
      atp: 60,
      canPromise: true,
    });
    // period 1: cumMps = 120 + 50 = 170, cumCo stays 60 (no demand in week 2) → atp = 110
    expect(r.data[1]).toMatchObject({
      productId: 'P1',
      quantity: 50,
      atp: 110,
      canPromise: true,
    });
  });

  it('falls back to production_orders and flags a negative ATP period when committed demand outpaces supply', async () => {
    mockRun
      .mockResolvedValueOnce({ rows: [] }) // mps_periods empty → triggers fallback
      .mockResolvedValueOnce({
        rows: [
          { product_id: 'P2', period: 'Hafta 3', quantity: '50', due_date: '2026-02-01', source: 'planned', week_num: 3 },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ product_id: 'P2', on_hand: '0' }] })
      .mockResolvedValueOnce({ rows: [{ product_id: 'P2', qty: '80', week_num: 3 }] });

    const r = await svc.getMps('P2');

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toHaveLength(1);
    // cumMps = 0 + 50 = 50, cumCo = 80 → atp = -30 → cannot promise
    expect(r.data[0]).toMatchObject({
      productId: 'P2',
      quantity: 50,
      source: 'planned',
      atp: -30,
      canPromise: false,
    });
  });

  it('returns Err with INTERNAL when the underlying query throws', async () => {
    mockRun.mockRejectedValueOnce(new Error('db unreachable'));

    const r = await svc.getMps();

    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('INTERNAL');
    expect(r.error.message).toContain('db unreachable');
  });

  it('returns an empty schedule when both mps_periods and the production_orders fallback are empty', async () => {
    mockRun
      .mockResolvedValueOnce({ rows: [] }) // mps_periods empty → triggers fallback
      .mockResolvedValueOnce({ rows: [] }) // production_orders fallback also empty
      .mockResolvedValueOnce({ rows: [] }) // loadOnHand still runs unconditionally
      .mockResolvedValueOnce({ rows: [] }); // loadCommittedDemand still runs unconditionally

    const r = await svc.getMps();

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual([]);
  });
});
