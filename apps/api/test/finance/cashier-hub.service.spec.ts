/**
 * CASHIER-HUB KAS-1 — CashierHubService behavioural unit tests.
 * Mocks ICashierHubRepository + GlPostingService (no DB, no real GL). Verifies:
 *   1. open → record cash_in → close computes expected = opening + Σcash_in − Σcash_out
 *   2. cash_out without a valid PIN (no PIN store configured) is rejected (403/FORBIDDEN)
 *   3. GL posting is called with the correct double-entry legs (cash_in: Dr 5010 / Cr 9010)
 *   4. idempotent movement: a re-fired reference returns the existing row, posts no second GL
 */

import { CashierHubService } from '../../src/modules/finance/cashier-hub/cashier-hub.service';
import type {
  ICashierHubRepository,
  CashierMovementType,
} from '../../src/modules/finance/cashier-hub/i-cashier-hub.repo';
import { GL } from '../../src/modules/finance/domain/constants/gl-accounts.constants';
import { Ok, Err, AppErr } from '../../src/common/result';

type Shift = {
  id: number;
  cashierUserId: number;
  openedAmount: number;
  status: 'open' | 'closed';
  closedAmount?: number | null;
  expectedAmount?: number | null;
  variance?: number | null;
};

type Movement = {
  id: number;
  shiftId: number;
  type: CashierMovementType;
  amount: number;
  reference: string;
  glEntryId: number | null;
  pinVerified: boolean;
};

function makeRepo(overrides: Partial<ICashierHubRepository> = {}): ICashierHubRepository {
  const base: ICashierHubRepository = {
    findOpenShiftByCashier: jest.fn(async () => Ok(null)),
    findShiftById: jest.fn(async () => Ok(null)),
    openShift: jest.fn(async (dto) =>
      Ok({ id: 1, cashierUserId: dto.cashierUserId, openedAmount: dto.openingAmount, status: 'open' } as never),
    ),
    closeShift: jest.fn(async (id, f) =>
      Ok({
        id,
        cashierUserId: 7,
        openedAmount: 100,
        status: 'closed',
        closedAmount: f.closedAmount,
        expectedAmount: f.expectedAmount,
        variance: f.variance,
      } as never),
    ),
    getShiftMovementTotals: jest.fn(async () => Ok({ cashIn: 0, cashOut: 0, movementCount: 0, byType: [] })),
    findMovementByReference: jest.fn(async () => Ok(null)),
    insertMovement: jest.fn(async (dto) =>
      Ok({ id: 99, ...dto, glEntryId: dto.glEntryId ?? null } as never),
    ),
    listMovements: jest.fn(async () => Ok([])),
    findCashierPinHash: jest.fn(async () => Ok(null)), // no PIN store configured by default
  };
  return { ...base, ...overrides };
}

function makeGl() {
  return { postJournal: jest.fn(async () => Ok(555)) } as unknown as {
    postJournal: jest.Mock;
  };
}

describe('CashierHubService (KAS-1)', () => {
  it('1) open → record cash_in → close computes expected = opening + Σcash_in − Σcash_out', async () => {
    const repo = makeRepo();
    const gl = makeGl();
    const svc = new CashierHubService(repo, gl as never);

    // open
    const opened = await svc.openShift({ cashierUserId: 7, openingAmount: 100 });
    expect(opened.ok).toBe(true);
    expect(repo.openShift).toHaveBeenCalledWith({ cashierUserId: 7, openingAmount: 100 });

    // record a cash_in of 250 against shift 1 (open)
    (repo.findShiftById as jest.Mock).mockResolvedValue(
      Ok({ id: 1, cashierUserId: 7, openedAmount: 100, status: 'open' }),
    );
    const mv = await svc.recordMovement(1, { type: 'cash_in', amount: 250, reference: 'R-IN-1' });
    expect(mv.ok).toBe(true);
    expect(repo.insertMovement).toHaveBeenCalled();

    // close: totals show 250 in, 0 out → expected = 100 + 250 − 0 = 350; variance = 360 − 350 = 10
    (repo.getShiftMovementTotals as jest.Mock).mockResolvedValue(
      Ok({
        cashIn: 250,
        cashOut: 0,
        movementCount: 1,
        byType: [{ type: 'cash_in', count: 1, total: 250 }],
      }),
    );
    const closed = await svc.closeShift(1, { closedAmount: 360 });
    expect(closed.ok).toBe(true);
    expect(closed.ok && closed.data.expectedAmount).toBe(350);
    // Z-report reconciliation: counted drawer + variance (over/short) + per-type breakdown.
    expect(closed.ok && closed.data.closedAmount).toBe(360);
    expect(closed.ok && closed.data.variance).toBe(10);
    expect(closed.ok && closed.data.byType).toEqual([{ type: 'cash_in', count: 1, total: 250 }]);
    expect(repo.closeShift).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ closedAmount: 360, expectedAmount: 350, variance: 10 }),
    );
  });

  it('2) cash_out without a valid PIN (no PIN store) is rejected, and posts no GL / no movement', async () => {
    const repo = makeRepo({
      findShiftById: jest.fn(async () => Ok({ id: 1, cashierUserId: 7, openedAmount: 100, status: 'open' } as never)),
      findCashierPinHash: jest.fn(async () => Ok(null)), // PIN store NOT configured → gate, do not forge
    });
    const gl = makeGl();
    const svc = new CashierHubService(repo, gl as never);

    // pin provided but no store → still rejected (gate-and-flag)
    const res = await svc.recordMovement(1, { type: 'cash_out', amount: 50, reference: 'R-OUT-1', pin: '1234' }, 7);
    expect(res.ok).toBe(false);
    expect(!res.ok && res.error.code).toBe('FORBIDDEN');
    expect(gl.postJournal).not.toHaveBeenCalled();
    expect(repo.insertMovement).not.toHaveBeenCalled();

    // missing pin entirely → also rejected
    const res2 = await svc.recordMovement(1, { type: 'salary_payout', amount: 50, reference: 'R-SAL-1' }, 7);
    expect(res2.ok).toBe(false);
    expect(!res2.ok && res2.error.code).toBe('FORBIDDEN');
  });

  it('3) GL posting called with correct legs for cash_in (Dr Cash 5010 / Cr Revenue 9010)', async () => {
    const repo = makeRepo({
      findShiftById: jest.fn(async () => Ok({ id: 1, cashierUserId: 7, openedAmount: 0, status: 'open' } as never)),
    });
    const gl = makeGl();
    const svc = new CashierHubService(repo, gl as never);

    const res = await svc.recordMovement(1, { type: 'cash_in', amount: 400, reference: 'R-IN-9' });
    expect(res.ok).toBe(true);
    expect(gl.postJournal).toHaveBeenCalledTimes(1);

    const [lines, reference] = gl.postJournal.mock.calls[0];
    expect(reference).toBe('KAS-R-IN-9');
    const debit = lines.find((l: { debit: number }) => l.debit > 0);
    const credit = lines.find((l: { credit: number }) => l.credit > 0);
    expect(debit.accountCode).toBe(GL.CASH); // 5010
    expect(debit.debit).toBe(400);
    expect(credit.accountCode).toBe(GL.REVENUE); // 9010
    expect(credit.credit).toBe(400);

    // and the returned GL entry id (555) is stored on the movement
    expect(repo.insertMovement).toHaveBeenCalledWith(expect.objectContaining({ glEntryId: 555 }));
  });

  it('4) idempotent movement: re-fired reference returns existing row, posts no second GL', async () => {
    const existing: Movement = {
      id: 42,
      shiftId: 1,
      type: 'cash_in',
      amount: 250,
      reference: 'R-DUP',
      glEntryId: 555,
      pinVerified: false,
    };
    const repo = makeRepo({
      findMovementByReference: jest.fn(async () => Ok(existing as never)),
    });
    const gl = makeGl();
    const svc = new CashierHubService(repo, gl as never);

    const res = await svc.recordMovement(1, { type: 'cash_in', amount: 250, reference: 'R-DUP' });
    expect(res.ok).toBe(true);
    expect(res.ok && (res.data as Movement).id).toBe(42);
    // idempotent: no GL post, no insert, did not even need the shift lookup
    expect(gl.postJournal).not.toHaveBeenCalled();
    expect(repo.insertMovement).not.toHaveBeenCalled();
  });

  it('open is rejected when the cashier already has an open shift', async () => {
    const repo = makeRepo({
      findOpenShiftByCashier: jest.fn(async () =>
        Ok({ id: 5, cashierUserId: 7, openedAmount: 0, status: 'open' } as never),
      ),
    });
    const svc = new CashierHubService(repo, makeGl() as never);
    const res = await svc.openShift({ cashierUserId: 7, openingAmount: 0 });
    expect(res.ok).toBe(false);
  });

  // sanity: Err/AppErr helpers wired (keeps import used + documents error shape)
  it('AppErr shape', () => {
    const e = Err(AppErr('FORBIDDEN', 'x'));
    expect(e.ok).toBe(false);
  });
});

// silence unused-type lint for Shift (documents the mocked row shape)
export type _Shift = Shift;
