/**
 * @module db
 * @description Source module. See exports for details.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const connectionString = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL yoki NEON_DATABASE_URL muhit o'zgaruvchisi o'rnatilmagan");
}
const pool = new Pool({ connectionString });

export const db = drizzle(pool);
