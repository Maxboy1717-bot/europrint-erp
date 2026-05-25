/**
 * test/pp/mps-atp.handler.spec.ts
 *
 * Unit tests for MpsAtpHandler. Pure compute — no dependencies to mock.
 */

import { MpsAtpHandler } from '../../src/modules/pp/application/queries/mps-atp.handler';
import type {
  MpsEntry,
  CommittedOrder,
} from '../../src/modules/pp/application/queries/mps-atp.handler';

// Decorator @Calculation wraps the synchronous calculateAtp into an async
// function — we must `await` the call even though the source signature
// returns Result<T>.
describe('MpsAtpHandler', () => {
  const handler = new MpsAtpHandler();

  it('returns VALIDATION when productId is empty', async () => {
    const r = await handler.calculateAtp({
      productId: '',
      onHand: 0,
      mpsEntries: [],
      committedOrders: [],
      periods: 4,
    });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('returns VALIDATION when periods is zero or negative', async () => {
    const r = await handler.calculateAtp({
      productId: 'P1',
      onHand: 0,
      mpsEntries: [],
      committedOrders: [],
      periods: 0,
    });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('returns VALIDATION when onHand is negative', async () => {
    const r = await handler.calculateAtp({
      productId: 'P1',
      onHand: -5,
      mpsEntries: [],
      committedOrders: [],
      periods: 4,
    });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('computes cumulative ATP balance when MPS exceeds committed orders', async () => {
    const mps: MpsEntry[] = [{ period: 0, quantity: 100 }, { period: 1, quantity: 50 }];
    const co: CommittedOrder[] = [{ period: 0, qty: 60 }];

    const r = await handler.calculateAtp({
      productId: 'P1',
      onHand: 20,
      mpsEntries: mps,
      committedOrders: co,
      periods: 3,
    });

    expect(r.ok).toBe(true);
    if (r.ok) {
      // P0: cumMps = 20+100=120, cumCo=60, atp=60
      expect(r.data.periods[0].atp).toBe(60);
      // P1: cumMps=170, cumCo=60, atp=110
      expect(r.data.periods[1].atp).toBe(110);
      expect(r.data.firstNegativePeriod).toBeNull();
      expect(r.data.totalAtp).toBe(110);
    }
  });

  it('flags the first negative ATP period when commitments exceed supply', async () => {
    const mps: MpsEntry[] = [{ period: 0, quantity: 50 }];
    const co: CommittedOrder[] = [{ period: 0, qty: 30 }, { period: 1, qty: 40 }];

    const r = await handler.calculateAtp({
      productId: 'P1',
      onHand: 0,
      mpsEntries: mps,
      committedOrders: co,
      periods: 2,
    });

    expect(r.ok).toBe(true);
    if (r.ok) {
      // P0: cumMps=50, cumCo=30, atp=20 → canPromise
      expect(r.data.periods[0].canPromise).toBe(true);
      // P1: cumMps=50, cumCo=70, atp=-20 → cannot promise
      expect(r.data.periods[1].canPromise).toBe(false);
      expect(r.data.firstNegativePeriod).toBe(1);
    }
  });

  it('aggregates duplicate-period MPS and CO entries into one bucket per period', async () => {
    const r = await handler.calculateAtp({
      productId: 'P1',
      onHand: 0,
      mpsEntries: [{ period: 0, quantity: 10 }, { period: 0, quantity: 5 }],
      committedOrders: [{ period: 0, qty: 3 }, { period: 0, qty: 2 }],
      periods: 1,
    });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.periods[0].mps).toBe(15);
      expect(r.data.periods[0].committedOrders).toBe(5);
      expect(r.data.periods[0].atp).toBe(10);
    }
  });
});
