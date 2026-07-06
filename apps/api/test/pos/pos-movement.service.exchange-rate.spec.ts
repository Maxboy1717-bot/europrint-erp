/**
 * test/pos/pos-movement.service.exchange-rate.spec.ts
 *
 * F6 sub-fix 3 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): PosMovementService.addLines() used to
 * default a foreign-currency line's exchangeRate to `?? 1` with no log — booking e.g. a USD line
 * at UZS par value (a ~12,700× understatement). It now resolves a real rate (owner-provided, else
 * the latest `exchange_rates` row) and GATES (rejects) when no rate is resolvable, mirroring
 * cashier-hub's KAS-1 gate. Only `addLines()` is exercised here — it depends solely on `repo`
 * among PosMovementService's many constructor deps, so the other 9 are unused stubs.
 */

// PosMovementService transitively imports LifecycleBlockService -> pos-lifecycle-block.repository.ts
// -> @workspace/db, which eagerly opens a real Pool() and throws without DATABASE_URL. Since we
// only exercise addLines() (uses `repo` alone, none of the other 9 injected deps), stub the DB
// module out entirely rather than requiring a live DB — same technique as
// test/pos-requisition-workflow.service.spec.ts.
jest.mock('../../../../lib/db/dist/cjs/index.js', () => ({ db: {}, eq: jest.fn(), sql: jest.fn() }), { virtual: true });
jest.mock('@workspace/db', () => ({ db: {}, eq: jest.fn(), sql: jest.fn() }));

import { PosMovementService } from '../../src/modules/pos/application/services/pos-movement.service';
import { Ok } from '../../src/common/result';
import type { IPosMovementRepository } from '../../src/modules/pos/domain/repositories/i-pos-movement.repo';

function makeRepoMock(): jest.Mocked<Pick<IPosMovementRepository, 'getMaxLineSequence' | 'insertLines' | 'findLatestExchangeRate'>> {
  return {
    getMaxLineSequence: jest.fn().mockResolvedValue(Ok(0)),
    insertLines: jest.fn().mockImplementation(async (values) => Ok(values)),
    findLatestExchangeRate: jest.fn(),
  };
}

const UNUSED = {} as never;

describe('PosMovementService.addLines() — F6 exchange-rate gate', () => {
  let repo: ReturnType<typeof makeRepoMock>;
  let svc: PosMovementService;

  beforeEach(() => {
    repo = makeRepoMock();
    svc = new PosMovementService(UNUSED, UNUSED, UNUSED, UNUSED, UNUSED, UNUSED, UNUSED, UNUSED, UNUSED, repo as unknown as IPosMovementRepository);
  });

  it('UZS lines need no rate lookup and post at exchangeRate=1', async () => {
    const r = await svc.addLines(1, [{ materialCardId: 10, quantity: 5, unitPrice: 1000 } as never]);
    expect(r.ok).toBe(true);
    expect(repo.findLatestExchangeRate).not.toHaveBeenCalled();
    if (r.ok) {
      const line = (r.data as unknown as Array<{ exchangeRate: number; unitPriceBase: number }>)[0];
      expect(line.exchangeRate).toBe(1);
      expect(line.unitPriceBase).toBe(1000);
    }
  });

  it('an explicit positive exchangeRate is used as-is, no DB lookup', async () => {
    const r = await svc.addLines(1, [{ materialCardId: 10, quantity: 2, unitPrice: 10, currency: 'USD', exchangeRate: 12000 } as never]);
    expect(r.ok).toBe(true);
    expect(repo.findLatestExchangeRate).not.toHaveBeenCalled();
    if (r.ok) {
      const line = (r.data as unknown as Array<{ exchangeRate: number; unitPriceBase: number; totalPriceBase: number }>)[0];
      expect(line.exchangeRate).toBe(12000);
      expect(line.unitPriceBase).toBe(120000); // 10 * 12000
      expect(line.totalPriceBase).toBe(240000); // 2 * 10 * 12000
    }
  });

  it('a foreign-currency line with no explicit rate resolves from exchange_rates (no silent 1:1)', async () => {
    repo.findLatestExchangeRate.mockResolvedValue(Ok(12700));
    const r = await svc.addLines(1, [{ materialCardId: 10, quantity: 1, unitPrice: 5, currency: 'USD' } as never]);
    expect(r.ok).toBe(true);
    expect(repo.findLatestExchangeRate).toHaveBeenCalledWith('USD');
    if (r.ok) {
      const line = (r.data as unknown as Array<{ exchangeRate: number }>)[0];
      expect(line.exchangeRate).toBe(12700);
      expect(line.exchangeRate).not.toBe(1); // the exact bug this closes
    }
  });

  it('GATES (rejects) a foreign-currency line when no rate is resolvable anywhere — never books at par', async () => {
    repo.findLatestExchangeRate.mockResolvedValue(Ok(null));
    const r = await svc.addLines(1, [{ materialCardId: 10, quantity: 1, unitPrice: 5, currency: 'USD' } as never]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/USD.*kurs topilmadi/);
    expect(repo.insertLines).not.toHaveBeenCalled();
  });
});
