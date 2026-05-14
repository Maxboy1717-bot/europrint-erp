/**
 * @module drizzle.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Ok, Err, safeCall, Result, AppError } from '@common/result';

// SECURITY: never use a hardcoded production-looking fallback URL. If the env
// var is missing in real production, fail loudly. In test/CI we accept a stub
// URL so module-load doesn't crash unit tests that mock the DB.
const _dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
const _isTestEnv =
  process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID || !!process.env.VITEST;
const _effectiveDbUrl = _dbUrl || (_isTestEnv ? 'postgres://stub:stub@localhost:5432/stub' : null);
if (!_effectiveDbUrl) {
  throw new Error('DATABASE_URL (or NEON_DATABASE_URL) environment variable is required');
}

const pool = new Pool({
  connectionString: _effectiveDbUrl,
  max: 10,
});

export const db = drizzle(pool);

@Injectable()
export class DrizzleService {
  private readonly logger = new Logger(DrizzleService.name);
  readonly db = db;

  async ping(): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      await db.select({ v: sql<number>`1` }).from(sql`(SELECT 1) _ping`);
    });
  }
}
