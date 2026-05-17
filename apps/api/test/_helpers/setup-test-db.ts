/**
 * setup-test-db.ts — Phase 8, Task 8.2
 *
 * Integration-test helper that exposes a real `pg` pool against the test
 * Postgres started via `docker-compose.test.yml`. Use only from integration
 * specs that need real DB I/O. Unit tests should keep mocking `db`.
 *
 * Lifecycle:
 *   const ctx = await setupTestDb();   // beforeAll
 *   await ctx.reset();                 // beforeEach (truncates HR tables)
 *   await ctx.close();                 // afterAll
 *
 * The helper is a tiny, self-contained wrapper:
 *   - Reads TEST_DATABASE_URL (fallback: postgres://test:test@localhost:55432/europrint_test)
 *   - Connects with a single-connection pool (deterministic; integration tests
 *     are not concurrent in CI).
 *   - Exposes `query<T>(sql, params)` and helpers for truncating known HR
 *     tables in dependency order.
 *
 * It does NOT auto-create schema. Run the project migration command first
 * against TEST_DATABASE_URL. See README block in docker-compose.test.yml.
 */

import { Pool, type PoolClient, type QueryResultRow } from 'pg';

export interface TestDbContext {
  /** Underlying pg pool (single connection). */
  readonly pool: Pool;
  /** Run a parametrized query and get strongly-typed rows. */
  query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: ReadonlyArray<unknown>,
  ): Promise<T[]>;
  /** Acquire a dedicated client (for transactions etc.). Caller releases. */
  withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>;
  /** Truncate the listed tables (RESTART IDENTITY CASCADE). */
  truncate(tables: ReadonlyArray<string>): Promise<void>;
  /**
   * Truncate a sensible default HR table set in dependency-safe order.
   * Add more tables here as integration tests need them.
   */
  reset(): Promise<void>;
  /** Close the pool. */
  close(): Promise<void>;
}

const DEFAULT_TEST_URL = 'postgres://test:test@localhost:55432/europrint_test';

/** Tables wiped by `reset()`. Keep child-before-parent if not using CASCADE. */
const HR_RESETTABLE_TABLES: ReadonlyArray<string> = [
  'employee_assets',
  'employee_kpi_scores',
  'employee_documents',
  'leave_requests',
  'attendance_records',
  'recruitment_funnel',
  'employees',
  'positions',
  'departments',
];

export async function setupTestDb(opts?: {
  connectionString?: string;
  resettable?: ReadonlyArray<string>;
}): Promise<TestDbContext> {
  const connectionString =
    opts?.connectionString ?? process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_URL;

  const pool = new Pool({
    connectionString,
    max: 1,
    // Fail fast in tests: don't hang on network issues.
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
  });

  // Smoke-test the connection. Throws a useful error if Postgres is missing.
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }
  } catch (err) {
    await pool.end().catch(() => undefined);
    throw new Error(
      `setupTestDb: cannot connect to ${connectionString}. ` +
        `Start it with \`docker compose -f docker-compose.test.yml up -d\`. ` +
        `Underlying error: ${(err as Error).message}`,
    );
  }

  const truncate = async (tables: ReadonlyArray<string>): Promise<void> => {
    if (tables.length === 0) return;
    const quoted = tables.map((t) => `"${t.replace(/"/g, '')}"`).join(', ');
    await pool.query(`TRUNCATE ${quoted} RESTART IDENTITY CASCADE`);
  };

  const ctx: TestDbContext = {
    pool,
    async query<T extends QueryResultRow = QueryResultRow>(
      sql: string,
      params?: ReadonlyArray<unknown>,
    ): Promise<T[]> {
      const res = await pool.query<T>(sql, params ? Array.from(params) : undefined);
      return res.rows;
    },
    async withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
      const client = await pool.connect();
      try {
        return await fn(client);
      } finally {
        client.release();
      }
    },
    truncate,
    async reset(): Promise<void> {
      const tables = opts?.resettable ?? HR_RESETTABLE_TABLES;
      // Wrap in try so a missing table (schema not migrated) reports cleanly.
      try {
        await truncate(tables);
      } catch (err) {
        const message = (err as Error).message;
        if (/does not exist/i.test(message)) {
          throw new Error(
            `setupTestDb.reset(): a target table is missing. ` +
              `Run drizzle migrations against TEST_DATABASE_URL before tests. ` +
              `pg error: ${message}`,
          );
        }
        throw err;
      }
    },
    async close(): Promise<void> {
      await pool.end();
    },
  };

  return ctx;
}
