/**
 * test/pos/procurement-request.service.pr-number-retry.spec.ts
 *
 * C8.3 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): the PR number generator used an unlocked
 * COUNT(*)+1 against procurement_requests — two concurrent createRequest() calls could compute
 * the same PR-YYYY-NNNNN. Live verification found procurement_requests.request_number ALREADY
 * has a UNIQUE constraint (contrary to the audit's "no UNIQUE" claim), so the real symptom was
 * a crash on collision, not a silent duplicate. The fix adds a pg_advisory_xact_lock (same
 * pattern as CcDocumentNumberService) plus a bounded retry-on-23505 for the header INSERT.
 * These tests exercise createRequest() end-to-end with @shared/db mocked to prove: (1) the
 * lock is acquired before the COUNT read, (2) a 23505 on the header INSERT triggers exactly one
 * fresh-number retry and still succeeds, (3) a non-collision DB error is not retried.
 */

function sqlText(call: unknown): string {
  const chunks = (call as { queryChunks?: unknown[] })?.queryChunks ?? [];
  return chunks
    .map((c) => (c && typeof c === 'object' && 'value' in (c as object) ? (c as { value: string[] }).value.join('') : ''))
    .join(' ');
}

const mockRawSql = jest.fn();
const mockTxExecute = jest.fn();
const mockDbTransaction = jest.fn(async (cb: (tx: { execute: typeof mockTxExecute }) => unknown) =>
  cb({ execute: mockTxExecute }),
);

jest.mock('@shared/db', () => ({
  rawSql: (...args: unknown[]) => mockRawSql(...args),
  db: { transaction: (cb: never) => mockDbTransaction(cb) },
}));
jest.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    queryChunks: strings.flatMap((s, i) => [{ value: [s] }, ...(i < values.length ? [{ value: [String(values[i])] }] : [])]),
  }),
  and: jest.fn(), eq: jest.fn(),
}));
jest.mock('@workspace/db', () => ({ employeeDebt: {} }));
// procurement-request.service.ts imports PosMovementService purely for a constructor
// parameter-property TYPE (createRequest() never calls it), but the real class transitively
// loads employee-ledger.repository.ts, which builds a module-scope `sql`-tagged constant from
// @workspace/db's re-exported `sql` at import time — needing a real drizzle-orm runtime this
// test's minimal mock doesn't provide. Stub it out to keep the import graph light.
jest.mock('../../src/modules/pos/application/services/pos-movement.service', () => ({ PosMovementService: class {} }));

import { ProcurementRequestService, CreateProcurementRequestInput } from '../../src/modules/pos/application/services/procurement-request.service';
import { ProcurementApprovalChainService } from '../../src/modules/pos/application/services/procurement-approval-chain.service';
import { PosMovementService } from '../../src/modules/pos/application/services/pos-movement.service';

const INPUT: CreateProcurementRequestInput = {
  requesterEmployeeId: 7,
  title: 'C8.3 test PR',
  items: [{ description: 'Item 1', quantity: 2, estimatedPrice: 10 }],
};

function uniqueViolationError() {
  const e = new Error('duplicate key value violates unique constraint "procurement_requests_request_number_key"');
  (e as unknown as { code: string }).code = '23505';
  return e;
}

describe('ProcurementRequestService.createRequest — C8.3 PR-number lock + retry', () => {
  let approvalChain: jest.Mocked<Partial<ProcurementApprovalChainService>>;
  let posMovement: jest.Mocked<Partial<PosMovementService>>;
  let eventBus: { publish: jest.Mock };
  let i18n: { t: jest.Mock };
  let service: ProcurementRequestService;

  beforeEach(() => {
    mockRawSql.mockReset();
    mockTxExecute.mockReset();
    mockDbTransaction.mockClear();
    approvalChain = {
      findEmployeeDepartment: jest.fn().mockResolvedValue({ ok: true, data: 3 }),
      resolveChainFromDepartment: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    };
    posMovement = {};
    eventBus = { publish: jest.fn() };
    i18n = { t: jest.fn(async (key: string) => key) };
    service = new ProcurementRequestService(
      approvalChain as ProcurementApprovalChainService,
      eventBus as never,
      posMovement as PosMovementService,
      i18n as never,
    );

    // Lock+count transaction: always reports count=2 (→ next number ...00003) unless a test
    // overrides mockTxExecute directly.
    mockTxExecute.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('pg_advisory_xact_lock')) return { rows: [] };
      if (text.includes('COUNT(*)')) return { rows: [{ c: 2 }] };
      throw new Error(`Unexpected tx query: ${text}`);
    });
  });

  it('acquires the advisory lock before reading COUNT(*) for the number', async () => {
    mockRawSql.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('INSERT INTO procurement_requests')) return { rows: [{ id: 50 }] };
      if (text.includes('INSERT INTO procurement_request_items')) return { rows: [] };
      throw new Error(`Unexpected rawSql query: ${text}`);
    });

    const result = await service.createRequest(INPUT, 1);

    expect(result.ok).toBe(true);
    expect(mockDbTransaction).toHaveBeenCalledTimes(1); // one locked transaction for the number
    const calls = mockTxExecute.mock.calls.map((c) => sqlText(c[0]));
    const lockIdx = calls.findIndex((t) => t.includes('pg_advisory_xact_lock'));
    const countIdx = calls.findIndex((t) => t.includes('COUNT(*)'));
    expect(lockIdx).toBeGreaterThanOrEqual(0);
    expect(countIdx).toBeGreaterThan(lockIdx);
  });

  it('retries with a freshly-locked number when the header INSERT hits a 23505 collision', async () => {
    let insertAttempt = 0;
    mockRawSql.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('INSERT INTO procurement_requests')) {
        insertAttempt++;
        if (insertAttempt === 1) throw uniqueViolationError();
        return { rows: [{ id: 51 }] };
      }
      if (text.includes('INSERT INTO procurement_request_items')) return { rows: [] };
      throw new Error(`Unexpected rawSql query: ${text}`);
    });

    const result = await service.createRequest(INPUT, 1);

    expect(result.ok).toBe(true);
    expect(insertAttempt).toBe(2);
    // one lock+count cycle for the first attempt, one more for the retry
    expect(mockDbTransaction).toHaveBeenCalledTimes(2);
  });

  it('does not retry a non-collision DB error on the header INSERT', async () => {
    mockRawSql.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('INSERT INTO procurement_requests')) throw new Error('connection reset');
      throw new Error(`Unexpected rawSql query: ${text}`);
    });

    const result = await service.createRequest(INPUT, 1);

    expect(result.ok).toBe(false);
    expect(mockDbTransaction).toHaveBeenCalledTimes(1); // no retry — failed fast
  });
});
