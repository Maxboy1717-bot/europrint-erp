/**
 * @module database
 * @description Source module. See exports for details.
 */

import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as sharedSchema from '../../shared/db/schema';

const connectionString =
  process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL (or NEON_DATABASE_URL) muhit o`zgaruvchisi o`rnatilishi shart — hardcoded fallback olib tashlangan (xavfsizlik)',
  );
}

// Pool sozlamalari env orqali sozlanadi:
//   DB_POOL_MAX        — maksimal connection (default 20, 24 modul uchun yetarli)
//   DB_POOL_MIN        — minimal idle connection (default 2)
//   DB_IDLE_TIMEOUT_MS — bo`sh connection necha ms da yopiladi (default 30s)
const pool = new Pool({
  connectionString,
  max: parseInt(process.env.DB_POOL_MAX ?? '20', 10),
  min: parseInt(process.env.DB_POOL_MIN ?? '2', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS ?? '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT_MS ?? '5000', 10),
});

const drizzleDb = drizzle(pool, { schema: sharedSchema });

export const db = drizzleDb;

@Injectable()
export class Database {
  readonly db = drizzleDb;

  get query() {
    return drizzleDb.query;
  }

  select(...args: Parameters<typeof drizzleDb.select>) {
    return drizzleDb.select(...args);
  }

  insert(table: Parameters<typeof drizzleDb.insert>[0]) {
    return drizzleDb.insert(table);
  }

  update(table: Parameters<typeof drizzleDb.update>[0]) {
    return drizzleDb.update(table);
  }

  delete(table: Parameters<typeof drizzleDb.delete>[0]) {
    return drizzleDb.delete(table);
  }

  execute(query: Parameters<typeof drizzleDb.execute>[0]) {
    return drizzleDb.execute(query);
  }
}
