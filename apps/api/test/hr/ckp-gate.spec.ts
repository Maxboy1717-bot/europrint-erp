/**
 * @module ckp-gate.spec
 * @description A3-follow-up (N+1 fix, owner-approved 2026-07-05) equivalence tests.
 *
 * Proves `CkpGateService.evaluatePeriodBatch(cardIds, from, to)` (NEW, one query for
 * MANY cards) returns, for EVERY card, the byte-identical result that
 * `CkpGateService.evaluatePeriod(cardId, from, to)` (EXISTING, one query PER card)
 * would return for that same card — across a fixed set of scenarios with KNOWN
 * expected pass/fail outcomes:
 *   1. No ckp_fact_values row on any day  -> every day BLOCKED (NO_FACT).
 *   2. Fact present, no deadline rule (deadline_hours NULL) -> every day OPEN.
 *   3. Fact present, deadline rule, submitted BEFORE deadline -> OPEN.
 *   4. Fact present, deadline rule, submitted AFTER deadline -> BLOCKED (DEADLINE_PASSED).
 *   5. Fact present, deadline rule, NEVER submitted (submittedAt null) -> BLOCKED.
 *   6. Card missing from the org_departments JOIN result (edge case) -> all-BLOCKED,
 *      matching what a solo evaluatePeriod would see (0 rows from its own query).
 *
 * `runQuery` (the only DB touchpoint) is mocked so both code paths run against the
 * IDENTICAL underlying row-set — this isolates the equivalence proof to the batching
 * logic itself (grouping-by-card + the shared `buildDayDecisions` helper), not to any
 * incidental DB state. `applyCkpGate` (the actual gate decision fn) is NOT mocked —
 * both paths exercise the real pure logic.
 */

import { CkpGateService, applyCkpGate } from '../../src/modules/hr/payroll/ckp-gate';

// ---------------------------------------------------------------------------
// Mock @shared/db's runQuery. Both `evaluatePeriod` (single-card SQL) and
// `evaluatePeriodBatch` (ANY($cardIds) SQL) hit this same mock; the mock
// inspects the compiled SQL text to decide whether it's a single-card or a
// batch query, and returns the matching slice of a shared fixture data-set.
// ---------------------------------------------------------------------------
type FactRow = {
  card_id?: number;
  fact_date: string | null;
  submitted_at: string | Date | null;
  deadline_hours: number | null;
};

// cardId -> deadline_hours (constant per card, mirrors org_departments.ckp_report_deadline_hours)
const DEADLINE_BY_CARD = new Map<number, number | null>([
  [101, null], // no deadline rule
  [102, 24], // 24h deadline rule
  [103, 24], // 24h deadline rule
  [104, 24], // 24h deadline rule
  // 105 intentionally absent -> simulates "card missing from org_departments"
]);

// cardId -> fact rows (fact_date + submitted_at) actually present in ckp_fact_values
const FACTS_BY_CARD = new Map<number, Array<{ fact_date: string; submitted_at: string | null }>>([
  [101, [{ fact_date: '2026-06-01', submitted_at: '2026-06-01T10:00:00.000Z' }]], // OPEN (no deadline rule)
  [102, [{ fact_date: '2026-06-01', submitted_at: '2026-06-01T10:00:00.000Z' }]], // OPEN (submitted well before deadline)
  [103, [{ fact_date: '2026-06-01', submitted_at: '2026-06-03T10:00:00.000Z' }]], // BLOCKED (submitted after deadline)
  [104, [{ fact_date: '2026-06-01', submitted_at: null }]], // BLOCKED (never submitted)
  // 105: no facts at all -> NO_FACT every day
]);

const FROM = '2026-06-01';
const TO = '2026-06-01'; // single-day window keeps fixtures small and deterministic

function rowsForCard(cardId: number): FactRow[] {
  const deadlineHours = DEADLINE_BY_CARD.has(cardId) ? (DEADLINE_BY_CARD.get(cardId) ?? null) : null;
  const facts = FACTS_BY_CARD.get(cardId) ?? [];
  if (facts.length === 0) {
    // LEFT JOIN with no matching ckp_fact_values row still yields ONE row per
    // org_departments match (fact_date/submitted_at NULL) — UNLESS the card
    // itself has no org_departments row (card 105's "missing" scenario), which
    // yields ZERO rows entirely (WHERE d.id = <missing> matches nothing).
    if (!DEADLINE_BY_CARD.has(cardId)) return [];
    return [{ card_id: cardId, fact_date: null, submitted_at: null, deadline_hours: deadlineHours }];
  }
  return facts.map((f) => ({
    card_id: cardId,
    fact_date: f.fact_date,
    submitted_at: f.submitted_at,
    deadline_hours: deadlineHours,
  }));
}

jest.mock('@shared/db', () => ({
  runQuery: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { runQuery } = require('@shared/db') as { runQuery: jest.Mock };

/**
 * Both evaluatePeriod (single card) and evaluatePeriodBatch (ANY(cardIds)) build the
 * SAME sql`...` tagged-template; drizzle-orm's `sql` produces an object whose queryChunks
 * contain the interpolated params. We don't need to parse SQL text — we can simply return
 * rows for ALL cards on every call and let each call-site filter appropriately, EXCEPT we
 * must mimic the real WHERE clause: evaluatePeriod's query is scoped to ONE cardId (via
 * `WHERE d.id = ${cardId}`), so on a per-card call we must know the invocation's cardId.
 * Simplest robust approach: track calls in call order and use a queue of "current cardId"
 * set by the test before each single-card call; for batch calls, return the union of all
 * requested cards' fixture rows (mirroring `WHERE d.id = ANY(cardIds)`).
 */
let currentSingleCardId: number | null = null;
let currentBatchCardIds: number[] | null = null;

beforeEach(() => {
  jest.clearAllMocks();
  currentSingleCardId = null;
  currentBatchCardIds = null;
  runQuery.mockImplementation(async () => {
    if (currentBatchCardIds !== null) {
      const rows = currentBatchCardIds.flatMap((id) => rowsForCard(id));
      return { rows };
    }
    if (currentSingleCardId !== null) {
      return { rows: rowsForCard(currentSingleCardId) };
    }
    return { rows: [] };
  });
});

async function evaluateSingle(svc: CkpGateService, cardId: number) {
  currentSingleCardId = cardId;
  currentBatchCardIds = null;
  const r = await svc.evaluatePeriod(cardId, FROM, TO);
  currentSingleCardId = null;
  return r;
}

async function evaluateBatch(svc: CkpGateService, cardIds: number[]) {
  currentBatchCardIds = cardIds;
  currentSingleCardId = null;
  const r = await svc.evaluatePeriodBatch(cardIds, FROM, TO);
  currentBatchCardIds = null;
  return r;
}

describe('CkpGateService — A3-follow-up batch equivalence (owner-approved 2026-07-05)', () => {
  const ALL_CARD_IDS = [101, 102, 103, 104, 105];

  it('sanity: applyCkpGate fixture data actually covers OPEN / NO_FACT / DEADLINE_PASSED', () => {
    // 101: fact present, no deadline rule -> OPEN
    expect(
      applyCkpGate({ hasFact: true, deadlineHours: null, factDate: '2026-06-01', submittedAt: new Date('2026-06-01T10:00:00.000Z') }).reason,
    ).toBe('OK');
    // 103: fact present, deadline rule, submitted late -> DEADLINE_PASSED
    expect(
      applyCkpGate({ hasFact: true, deadlineHours: 24, factDate: '2026-06-01', submittedAt: new Date('2026-06-03T10:00:00.000Z') }).reason,
    ).toBe('DEADLINE_PASSED');
    // 105: no fact -> NO_FACT
    expect(applyCkpGate({ hasFact: false, deadlineHours: null, factDate: '2026-06-01', submittedAt: null }).reason).toBe('NO_FACT');
  });

  it.each(ALL_CARD_IDS)('card #%d: evaluatePeriodBatch matches evaluatePeriod exactly', async (cardId) => {
    const svc = new CkpGateService();

    const soloR = await evaluateSingle(svc, cardId);
    expect(soloR.ok).toBe(true);

    const batchR = await evaluateBatch(svc, ALL_CARD_IDS);
    expect(batchR.ok).toBe(true);
    if (!soloR.ok || !batchR.ok) return;

    const batchForCard = batchR.data.get(cardId);
    expect(batchForCard).toBeDefined();
    // Deep-equal: same factDate, same decision.open/reason/factor/deadlineAt for every day.
    expect(batchForCard).toEqual(soloR.data);
  });

  it('produces the SAME known pass/fail verdict per card (fixed expected table)', async () => {
    const svc = new CkpGateService();
    const batchR = await evaluateBatch(svc, ALL_CARD_IDS);
    expect(batchR.ok).toBe(true);
    if (!batchR.ok) return;

    const expected: Record<number, 'OK' | 'NO_FACT' | 'DEADLINE_PASSED'> = {
      101: 'OK', // no deadline rule -> open
      102: 'OK', // submitted before deadline -> open
      103: 'DEADLINE_PASSED', // submitted after deadline -> blocked
      104: 'DEADLINE_PASSED', // never submitted, deadline rule exists -> blocked
      105: 'NO_FACT', // card missing entirely -> blocked
    };
    for (const cardId of ALL_CARD_IDS) {
      const days = batchR.data.get(cardId);
      expect(days).toBeDefined();
      expect(days?.[0]?.decision.reason).toBe(expected[cardId]);
      const expectOpen = expected[cardId] === 'OK';
      expect(days?.[0]?.decision.open).toBe(expectOpen);
      expect(days?.[0]?.decision.factor).toBe(expectOpen ? 1 : 0);
    }
  });

  it('batch issues exactly ONE runQuery call for N cards (the actual N+1 fix)', async () => {
    const svc = new CkpGateService();
    runQuery.mockClear();
    currentBatchCardIds = ALL_CARD_IDS;
    await svc.evaluatePeriodBatch(ALL_CARD_IDS, FROM, TO);
    currentBatchCardIds = null;
    expect(runQuery).toHaveBeenCalledTimes(1);
  });

  it('the OLD per-card path issues N runQuery calls for N cards (documents the fixed problem)', async () => {
    const svc = new CkpGateService();
    runQuery.mockClear();
    for (const cardId of ALL_CARD_IDS) {
      await evaluateSingle(svc, cardId);
    }
    expect(runQuery).toHaveBeenCalledTimes(ALL_CARD_IDS.length);
  });

  it('duplicate cardIds in the batch input are de-duplicated but still resolve for every caller', async () => {
    const svc = new CkpGateService();
    const withDupes = [101, 101, 102, 102, 103];
    const batchR = await evaluateBatch(svc, withDupes);
    expect(batchR.ok).toBe(true);
    if (!batchR.ok) return;
    expect(batchR.data.size).toBe(3); // 101, 102, 103 unique
    expect(batchR.data.get(101)?.[0]?.decision.reason).toBe('OK');
  });

  it('empty cardIds array returns an empty map without querying', async () => {
    const svc = new CkpGateService();
    runQuery.mockClear();
    const batchR = await svc.evaluatePeriodBatch([], FROM, TO);
    expect(batchR.ok).toBe(true);
    if (batchR.ok) expect(batchR.data.size).toBe(0);
    expect(runQuery).not.toHaveBeenCalled();
  });

  it('invalid date range fails the SAME way for both evaluatePeriod and evaluatePeriodBatch', async () => {
    const svc = new CkpGateService();
    const soloR = await svc.evaluatePeriod(101, '2026-06-10', '2026-06-01');
    const batchR = await svc.evaluatePeriodBatch([101], '2026-06-10', '2026-06-01');
    expect(soloR.ok).toBe(false);
    expect(batchR.ok).toBe(false);
    if (!soloR.ok && !batchR.ok) {
      expect(batchR.error.code).toBe(soloR.error.code);
    }
  });

  it('a hard DB failure on the batch query returns Err (fail-closed for the WHOLE batch, never silently open)', async () => {
    const svc = new CkpGateService();
    runQuery.mockImplementationOnce(async () => {
      throw new Error('connection reset');
    });
    const batchR = await svc.evaluatePeriodBatch(ALL_CARD_IDS, FROM, TO);
    expect(batchR.ok).toBe(false);
  });
});
