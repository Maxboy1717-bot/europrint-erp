/**
 * test/_setup/test-db.ts
 *
 * Postgres testcontainer helper for integration tests. Skipped automatically
 * when Docker is unavailable (Windows dev machines). For pure unit tests, the
 * existing pattern is jest.mock('../src/shared/db') — prefer that for speed.
 *
 * Usage:
 *   const { db, close } = await startTestDb();
 *   // ... run integration test ...
 *   await close();
 */

import { execSync } from 'node:child_process';

export interface TestDb {
  url: string;
  db: unknown;
  close: () => Promise<void>;
}

export function isDockerAvailable(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns a Postgres testcontainer or null when Docker is unavailable.
 * Callers must check for null and skip the test via `describe.skip`.
 */
export async function startTestDb(): Promise<TestDb | null> {
  if (!isDockerAvailable()) return null;

  // Lazy import — testcontainers is a heavy dep, only required when Docker exists.
  const { PostgreSqlContainer } = await import('@testcontainers/postgresql').catch(() => ({
    PostgreSqlContainer: null as unknown as new () => { start: () => Promise<unknown> },
  }));
  if (!PostgreSqlContainer) return null;

  const container = await new (PostgreSqlContainer as unknown as new () => {
    withDatabase: (n: string) => unknown;
    start: () => Promise<{
      getConnectionUri: () => string;
      stop: () => Promise<void>;
    }>;
  })()
    .withDatabase('europrint_test')
    // @ts-expect-error fluent return shape
    .start();

  // @ts-expect-error fluent return shape
  const url = container.getConnectionUri();
  // @ts-expect-error
  const close = async () => { await container.stop(); };

  // Drizzle migration — caller must wire up its own schema; we don't import
  // lib/db here to keep this helper schema-agnostic.
  return { url, db: null, close };
}

/** Skips a describe block when Docker is unavailable. */
export const describeWithDb =
  isDockerAvailable() ? describe : describe.skip;
