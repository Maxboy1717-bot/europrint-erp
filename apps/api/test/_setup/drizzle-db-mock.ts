/**
 * test/_setup/drizzle-db-mock.ts
 *
 * Shared helper for repository unit tests. Builds a flexible mock of the
 * `db` object from `@shared/db` that supports the chainable Drizzle
 * query-builder API (`db.select().from().where().orderBy().limit().offset()`,
 * `db.insert().values().returning()`, `db.update().set().where().returning()`,
 * `db.delete().where()`).
 *
 * Each call to one of the terminal builders (`select`, `insert`, `update`,
 * `delete`) returns a fresh chain whose final promise is resolved from one
 * of the four `next*` queues. Tests push expected outcomes onto these queues
 * before invoking the repository method.
 *
 * Usage:
 *   const { db, queueSelect, queueInsert, queueUpdate, queueDelete } =
 *     makeDbMock();
 *   queueSelect([{ id: 1 }]);
 *   const r = await repo.findById(1);
 */

type DbResult = unknown;

export interface DbMock {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  execute: jest.Mock;
}

export interface DrizzleMockKit {
  db: DbMock;
  queueSelect: (value: DbResult | Error) => void;
  queueInsert: (value: DbResult | Error) => void;
  queueUpdate: (value: DbResult | Error) => void;
  queueDelete: (value: DbResult | Error) => void;
  runQuery: jest.Mock;
  rawSql: jest.Mock;
  reset: () => void;
}

export function makeDbMock(): DrizzleMockKit {
  const selectQueue: Array<DbResult | Error> = [];
  const insertQueue: Array<DbResult | Error> = [];
  const updateQueue: Array<DbResult | Error> = [];
  const deleteQueue: Array<DbResult | Error> = [];

  const consume = (q: Array<DbResult | Error>): Promise<DbResult> => {
    const v = q.shift();
    if (v instanceof Error) return Promise.reject(v);
    return Promise.resolve(v ?? []);
  };

  function chainable(queue: Array<DbResult | Error>): Record<string, unknown> {
    const handler: ProxyHandler<Record<string, unknown>> = {
      get(_target, prop): unknown {
        if (prop === 'then') {
          return (resolve: (v: DbResult) => void, reject?: (e: unknown) => void) =>
            consume(queue).then(resolve, reject);
        }
        if (prop === 'catch') {
          return (reject: (e: unknown) => void) => consume(queue).catch(reject);
        }
        if (prop === 'execute') {
          return () => consume(queue);
        }
        // any other chainable method
        return () => chain;
      },
    };
    const chain = new Proxy({}, handler);
    return chain;
  }

  const db: DbMock = {
    select: jest.fn(() => chainable(selectQueue)),
    insert: jest.fn(() => chainable(insertQueue)),
    update: jest.fn(() => chainable(updateQueue)),
    delete: jest.fn(() => chainable(deleteQueue)),
    execute: jest.fn(() => consume(selectQueue)),
  };

  const runQuery = jest.fn().mockResolvedValue({ rows: [] });
  const rawSql = jest.fn().mockResolvedValue([]);

  return {
    db,
    queueSelect: (v) => selectQueue.push(v),
    queueInsert: (v) => insertQueue.push(v),
    queueUpdate: (v) => updateQueue.push(v),
    queueDelete: (v) => deleteQueue.push(v),
    runQuery,
    rawSql,
    reset: () => {
      selectQueue.length = 0;
      insertQueue.length = 0;
      updateQueue.length = 0;
      deleteQueue.length = 0;
      db.select.mockClear();
      db.insert.mockClear();
      db.update.mockClear();
      db.delete.mockClear();
      db.execute.mockClear();
      runQuery.mockClear();
      rawSql.mockClear();
    },
  };
}
