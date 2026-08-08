/**
 * test/kanban/kanban-status-column-map.spec.ts
 *
 * Owner-decisions batch item 4 (Guruh-B): SD status -> Kanban column auto-move.
 * KanbanCardsRepository.moveOrderCardByStatusMap reads the kanban_status_column_map
 * rule for `newStatus` and, if present, moves every linked sales_order card to the
 * mapped column (same board only, only when it changes column; sort_order = MAX+1).
 *
 * INERT by default: the map ships with ZERO rows, so with no matching rule the method
 * is a pure no-op (NO column_id UPDATE emitted). This is a SEPARATE mechanism from
 * appendOrderStatusNote (whose SQL must stay column_id-free — pinned in the sibling
 * order-status-changed-kanban.spec.ts).
 *
 * The method wraps its work in db.transaction(async (tx) => ...) with Drizzle's fluent
 * builder (mirrors moveOrderCardToCancelled). We mock @shared/db and drive the tx with
 * a FIFO queue of per-query results (each awaited builder chain shifts one result),
 * capturing update()/set() so we can assert whether a column_id move was emitted.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Loose local alias — mirror test/_setup/db-mock.ts (the project lint rule bans `any`).
type Any = unknown;

const mockTransaction = jest.fn();
jest.mock('@shared/db', () => ({
  db: { transaction: (cb: never) => mockTransaction(cb) },
  runQuery: jest.fn(),
}));

import { KanbanCardsRepository } from '../../src/modules/kanban/infrastructure/repositories/kanban-cards.repo';

interface TxProbe {
  tx: Any;
  setCalls: Any[];
  updateCount: () => number;
}

/**
 * Builds a Drizzle-tx stub whose every builder method returns the same chainable
 * object, and where each awaited chain resolves the next item from `queue` (FIFO).
 * `set(...)` args are captured so a test can assert what an UPDATE set.
 */
function makeTx(queue: Any[]): TxProbe {
  const setCalls: Any[] = [];
  let updateCalls = 0;

  const chain: Record<string, Any> = {};
  for (const k of ['select', 'from', 'where', 'limit', 'orderBy']) {
    chain[k] = jest.fn(() => chain);
  }
  chain.update = jest.fn(() => { updateCalls += 1; return chain; });
  chain.set = jest.fn((v: Any) => { setCalls.push(v); return chain; });
  // Thenable: awaiting any builder chain resolves the next queued result.
  chain.then = (resolve: (v: Any) => Any, reject?: (e: Any) => Any) => {
    try {
      const v = queue.length ? queue.shift() : [];
      return Promise.resolve(resolve(v));
    } catch (e) {
      return reject ? Promise.resolve(reject(e)) : Promise.reject(e);
    }
  };

  return { tx: chain, setCalls, updateCount: () => updateCalls };
}

/** Wires mockTransaction to run the repo's tx callback against a fresh tx stub. */
function runWith(queue: Any[]): TxProbe {
  const probe = makeTx(queue);
  mockTransaction.mockImplementation(async (cb: (tx: Any) => Promise<Any>) => cb(probe.tx));
  return probe;
}

describe('KanbanCardsRepository.moveOrderCardByStatusMap — SD status -> column auto-move (owner batch #4)', () => {
  let repo: KanbanCardsRepository;

  beforeEach(() => {
    mockTransaction.mockReset();
    repo = new KanbanCardsRepository();
  });

  it('(a) is a NO-OP with no map row — emits NO column_id UPDATE (ships INERT)', async () => {
    // Only the map lookup runs; it returns [] -> method returns before any card work.
    const probe = runWith([[]]);

    const res = await repo.moveOrderCardByStatusMap(42, 'in_production');

    expect(res.ok).toBe(true);
    expect(probe.updateCount()).toBe(0);   // no UPDATE at all
    expect(probe.setCalls).toHaveLength(0); // nothing set -> no column_id move
  });

  it('(b) with a map row present, emits an UPDATE setting column_id to the mapped column', async () => {
    const probe = runWith([
      [{ kanban_column_id: 17 }],                        // 1. map lookup: in_production -> col 17
      [{ id: 17, board_id: 2 }],                         // 2. mapped column lives on board 2
      [{ id: 100, board_id: 2, column_id: 16 }],         // 3. linked card on board 2, currently col 16
      [{ max_order: 5 }],                                // 4. MAX(sort_order) in target col 17
      [],                                                // 5. the UPDATE itself (result ignored)
    ]);

    const res = await repo.moveOrderCardByStatusMap(42, 'in_production');

    expect(res.ok).toBe(true);
    expect(probe.updateCount()).toBe(1);
    expect(probe.setCalls).toHaveLength(1);

    const setArg = probe.setCalls[0] as Record<string, Any>;
    expect(setArg).toHaveProperty('column_id', 17);   // moved to the mapped column
    expect(setArg).toHaveProperty('sort_order', 6);   // MAX(5)+1 -> appended last
    expect(setArg).toHaveProperty('updated_at');       // bumped
  });

  it('(c) does NOT move when the card already sits in the mapped column (no redundant UPDATE)', async () => {
    const probe = runWith([
      [{ kanban_column_id: 16 }],                        // map: status -> col 16
      [{ id: 16, board_id: 2 }],                         // mapped column on board 2
      [{ id: 100, board_id: 2, column_id: 16 }],         // card already in col 16
    ]);

    const res = await repo.moveOrderCardByStatusMap(7, 'shipped');

    expect(res.ok).toBe(true);
    expect(probe.updateCount()).toBe(0);
  });

  it('(d) does NOT move when the mapped column is on a different board than the card', async () => {
    const probe = runWith([
      [{ kanban_column_id: 99 }],                        // map: status -> col 99
      [{ id: 99, board_id: 5 }],                         // mapped column on board 5
      [{ id: 100, board_id: 2, column_id: 16 }],         // card on board 2 -> board mismatch
    ]);

    const res = await repo.moveOrderCardByStatusMap(7, 'approved');

    expect(res.ok).toBe(true);
    expect(probe.updateCount()).toBe(0);
  });

  it('returns Err (never throws) when the transaction fails', async () => {
    mockTransaction.mockImplementation(async () => { throw new Error('db down'); });

    const res = await repo.moveOrderCardByStatusMap(1, 'x');

    expect(res.ok).toBe(false);
  });
});
