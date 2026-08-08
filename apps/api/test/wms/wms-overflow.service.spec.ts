/**
 * test/wms/wms-overflow.service.spec.ts
 *
 * Unit tests for WmsOverflowService (idish-yaxlitlash overflow chiqim mantig'i).
 * Vizyon: docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md §2 (22-24 savol).
 *
 * Mocks IWmsRepository.withTransaction — the executor (`tx.execute`) is stubbed
 * per-scenario so the pure validation/overflow-calculation logic is exercised
 * with real assertions, matching the wms-quarantine-gate.service.spec.ts
 * mock-repo convention.
 */
import { WmsOverflowService, OverflowIssueParams } from '../../src/modules/wms/application/wms-overflow.service';
import type { IWmsRepository, DrizzleExecutor } from '../../src/modules/wms/domain/repositories/wms.repository';
import { Result } from '../../src/common/result';

function baseParams(overrides: Partial<OverflowIssueParams> = {}): OverflowIssueParams {
  return {
    sourceWarehouseId: 1,
    deptWarehouseId: 2,
    materialId: 10,
    requestedAmount: 3,
    issuedAmount: 5,
    ppId: null,
    issuedBy: null,
    ...overrides,
  };
}

/** Builds a mock IWmsRepository whose withTransaction runs `work` against a
 * stub `tx.execute` that returns the given queued rows (one per call). */
function makeMockRepo(execImpl: (call: number) => { rows: unknown[] }): {
  repo: IWmsRepository;
  execute: jest.Mock;
} {
  const execute = jest.fn().mockImplementation(() => {
    const call = execute.mock.calls.length - 1;
    return Promise.resolve(execImpl(call));
  });
  const tx = { execute } as unknown as DrizzleExecutor;

  const repo = {
    withTransaction: jest.fn(async (work: (tx: DrizzleExecutor) => Promise<Result<unknown>>) => work(tx)),
  } as unknown as IWmsRepository;

  return { repo, execute };
}

describe('WmsOverflowService.issueWithOverflow', () => {
  it('issuedAmount < requestedAmount → Err INVALID_QUANTITY (no transaction started)', async () => {
    const { repo } = makeMockRepo(() => ({ rows: [] }));
    const svc = new WmsOverflowService(repo);

    const r = await svc.issueWithOverflow(baseParams({ requestedAmount: 5, issuedAmount: 3 }));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INVALID_QUANTITY');
    expect(repo.withTransaction).not.toHaveBeenCalled();
  });

  it('sourceWarehouseId === deptWarehouseId → Err SAME_WAREHOUSE (no transaction started)', async () => {
    const { repo } = makeMockRepo(() => ({ rows: [] }));
    const svc = new WmsOverflowService(repo);

    const r = await svc.issueWithOverflow(baseParams({ sourceWarehouseId: 7, deptWarehouseId: 7 }));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('SAME_WAREHOUSE');
    expect(repo.withTransaction).not.toHaveBeenCalled();
  });

  it('requested=3, issued=5: overflow=2 credited to dept warehouse, full 5 decremented from source', async () => {
    const { repo, execute } = makeMockRepo((call) => {
      if (call === 0) return { rows: [{ id: 101 }] }; // source decrement guard hit
      if (call === 1) return { rows: [] }; // overflow upsert (no RETURNING)
      return { rows: [{ id: 555 }] }; // goods-issue insert
    });
    const svc = new WmsOverflowService(repo);

    const r = await svc.issueWithOverflow(baseParams({ requestedAmount: 3, issuedAmount: 5 }));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.overflowAmount).toBe(2);
      expect(r.data.issuedAmount).toBe(5);
      expect(r.data.requestedAmount).toBe(3);
      expect(r.data.goodsIssueId).toBe(555);
    }
    // 3 SQL statements: source decrement, dept overflow upsert, goods-issue insert.
    expect(execute).toHaveBeenCalledTimes(3);
  });

  it('requested=issued (no overflow): dept warehouse upsert is SKIPPED, overflowAmount=0', async () => {
    const { repo, execute } = makeMockRepo((call) => {
      if (call === 0) return { rows: [{ id: 101 }] }; // source decrement guard hit
      return { rows: [{ id: 777 }] }; // goods-issue insert (2nd call, no overflow upsert in between)
    });
    const svc = new WmsOverflowService(repo);

    const r = await svc.issueWithOverflow(baseParams({ requestedAmount: 4, issuedAmount: 4 }));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.overflowAmount).toBe(0);
      expect(r.data.goodsIssueId).toBe(777);
    }
    // Only 2 SQL statements: source decrement + goods-issue insert (overflow upsert skipped for 0).
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('source warehouse has insufficient stock (guarded decrement returns no row) → Err INVALID_QUANTITY', async () => {
    const { repo } = makeMockRepo(() => ({ rows: [] })); // decrement guard never matches

    const svc = new WmsOverflowService(repo);
    const r = await svc.issueWithOverflow(baseParams());

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INVALID_QUANTITY');
  });

  it('goods-issue insert fails to return an id → Err DB_ERROR', async () => {
    const { repo } = makeMockRepo((call) => {
      if (call === 0) return { rows: [{ id: 101 }] };
      if (call === 1) return { rows: [] }; // overflow upsert
      return { rows: [] }; // goods-issue insert fails
    });
    const svc = new WmsOverflowService(repo);

    const r = await svc.issueWithOverflow(baseParams({ requestedAmount: 3, issuedAmount: 5 }));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  it('fractional overflow is rounded to 4 decimal places', async () => {
    const { repo } = makeMockRepo((call) => {
      if (call === 0) return { rows: [{ id: 101 }] };
      if (call === 1) return { rows: [] };
      return { rows: [{ id: 999 }] };
    });
    const svc = new WmsOverflowService(repo);

    const r = await svc.issueWithOverflow(
      baseParams({ requestedAmount: 1.11111, issuedAmount: 2.22222 }),
    );

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.overflowAmount).toBe(1.1111);
  });
});
