/**
 * test/_setup/db-mock.ts
 *
 * Reusable chainable mock factory for Drizzle ORM `db` object used by
 * repository unit tests. The factory builds a Proxy-based stub where every
 * builder method (select, from, where, join, ...) returns the same chainable
 * object, while the final terminal step is a thenable that resolves to the
 * supplied result.
 *
 * Usage in a spec file:
 *   import { makeDbChain, makeDbChainReject } from '../../_setup/db-mock';
 *
 *   const db = makeDbChain([{ id: 1 }]);
 *   jest.mock('@shared/db', () => ({ db, runQuery: jest.fn(), rawSql: jest.fn() }));
 *
 * NOTE: ts-jest with isolatedModules requires the mock factory to NOT close
 * over outer scope. Spec files build chains inline and reassign behaviour via
 * `.mockResolvedValue()` on the exported db reference.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Local `Any` alias to satisfy the project lint rule banning `any` in tests.
// We intentionally need very loose typing here to mirror Drizzle's fluent
// builder shape without dragging in every table schema.
type Any = unknown;

export interface ChainStub {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  execute: jest.Mock;
  from: jest.Mock;
  where: jest.Mock;
  values: jest.Mock;
  set: jest.Mock;
  innerJoin: jest.Mock;
  leftJoin: jest.Mock;
  rightJoin: jest.Mock;
  groupBy: jest.Mock;
  orderBy: jest.Mock;
  limit: jest.Mock;
  offset: jest.Mock;
  returning: jest.Mock;
  onConflictDoNothing: jest.Mock;
  onConflictDoUpdate: jest.Mock;
  then: jest.Mock;
  catch: jest.Mock;
  /** Reassign the terminal resolved value after creation. */
  __setResolved: (value: Any) => void;
  /** Reassign the terminal rejection. */
  __setRejected: (err: unknown) => void;
}

export function makeDbChain(resolved: Any = []): ChainStub {
  let _resolved: Any = resolved;
  let _rejected: unknown | undefined;

  const chain: Partial<ChainStub> = {};
  const builderKeys = [
    'select', 'insert', 'update', 'delete', 'execute',
    'from', 'where', 'values', 'set',
    'innerJoin', 'leftJoin', 'rightJoin',
    'groupBy', 'orderBy', 'limit', 'offset',
    'returning', 'onConflictDoNothing', 'onConflictDoUpdate',
  ] as const;
  for (const k of builderKeys) {
    (chain as Record<string, jest.Mock>)[k] = jest.fn(() => chain);
  }
  chain.then = jest.fn((resolve: (v: Any) => Any, reject?: (e: unknown) => Any) => {
    if (_rejected !== undefined) {
      if (reject) return Promise.resolve(reject(_rejected));
      return Promise.reject(_rejected);
    }
    return Promise.resolve(resolve(_resolved));
  });
  chain.catch = jest.fn((reject: (e: unknown) => Any) => {
    if (_rejected !== undefined) return Promise.resolve(reject(_rejected));
    return Promise.resolve(_resolved);
  });
  chain.__setResolved = (value: Any) => { _resolved = value; _rejected = undefined; };
  chain.__setRejected = (err: unknown) => { _rejected = err; };
  return chain as ChainStub;
}

export function makeDb(resolved: Any = []): ChainStub & { transaction: jest.Mock } {
  const chain = makeDbChain(resolved);
  const tx = jest.fn(async (fn: (t: ChainStub) => Promise<Any>) => fn(chain));
  return Object.assign(chain, { transaction: tx });
}

export function makeRunQuery(rows: unknown[] = []): jest.Mock {
  return jest.fn().mockResolvedValue({ rows });
}
